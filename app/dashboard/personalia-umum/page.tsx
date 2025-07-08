'use client'; // <-- Tambahkan directive ini di baris paling atas

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { Eye, Search, BookOpen, Briefcase, Calendar, FileText, MessageSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from 'date-fns';

import { FileUpload } from "@/components/file-upload";


type FormData = {
  tanggal?: string;
  jenis_dokumen?: string;
  file_url?: string;
  file_name?: string;
  created_at?: string;
  updated_at?: string;
  nomor_surat?: string;
  dari?: string;
  perihal?: string;
  [key: string]: string | number | undefined | { fileName: string; fileUrl: string };
}

type HistoryItem = {
  id: string;
  table: string;
  tanggal: string;
  file_name: string;
  file_url?: string;
  jenis?: string;
  detailFields: { key: string, label: string, value: any }[];
  [key: string]: any;
}

type StatCard = {
  title: string;
  value: number;
  icon: any;
  color: string;
  table: string;
  formType: string;
  fields?: { key: keyof FormData, label: string, type: string }[];
}


export default function PersonaliaUmumPage() {
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form'); // Tambahkan state untuk mode view
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<StatCard[]>([
    { title: "Dokumen ISPO", value: 0, icon: BookOpen, color: "bg-blue-100 text-blue-700", table: "dokumen_ispo", formType: "dokumen-ispo", fields: [{ key: 'jenis_dokumen', label: 'Jenis Dokumen', type: 'text' }, { key: 'tanggal', label: 'Tanggal', type: 'date' }] },
    { title: "Dokumen RSPO", value: 0, icon: BookOpen, color: "bg-green-100 text-green-700", table: "dokumen_rspo", formType: "dokumen-rspo", fields: [{ key: 'jenis_dokumen', label: 'Jenis Dokumen', type: 'text' }, { key: 'tanggal', label: 'Tanggal', type: 'date' }] },
    { title: "Database Karyawan", value: 0, icon: Briefcase, color: "bg-purple-100 text-purple-700", table: "database_karyawan", formType: "database-karyawan", fields: [{ key: 'jenis_dokumen', label: 'Jenis Dokumen', type: 'text' }, { key: 'tanggal', label: 'Tanggal', type: 'date' }] },
    { title: "Database Cuti", value: 0, icon: Calendar, color: "bg-yellow-100 text-yellow-700", table: "database_cuti", formType: "database-cuti", fields: [{ key: 'jenis_dokumen', label: 'Jenis Dokumen', type: 'text' }, { key: 'tanggal', label: 'Tanggal', type: 'date' }] },
    { title: "Memorandum", value: 0, icon: MessageSquare, color: "bg-pink-100 text-pink-700", table: "memorandum_personalia", formType: "memorandum", fields: [{ key: 'nomor_surat', label: 'Nomor Surat', type: 'text' }, { key: 'dari', label: 'Dari', type: 'text' }, { key: 'tanggal', label: 'Tanggal', type: 'date' }, { key: 'perihal', label: 'Perihal', type: 'textarea' }] },
    { title: "Arsip Dokumen Lain", value: 0, icon: FileText, color: "bg-teal-100 text-teal-700", table: "arsip_dokumen_lain", formType: "arsip-dokumen-lain", fields: [{ key: 'jenis_dokumen', label: 'Jenis Dokumen', type: 'text' }, { key: 'tanggal', label: 'Tanggal', type: 'date' }, { key: 'perihal', label: 'Keterangan', type: 'textarea' }] },
  ]);

  const supabase = createClient();

  // Function to fetch statistics and history
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Stats
      const updatedStats = await Promise.all(
        stats.map(async (stat) => {
          const { count, error } = await supabase
            .from(stat.table)
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.error(`Error fetching stats for ${stat.table}:`, error);
            return stat;
          }
          return { ...stat, value: count || 0 };
        })
      );
      setStats(updatedStats);

      // Fetch History
      const historyItems: HistoryItem[] = [];
      for (const stat of updatedStats) {
        const { data, error } = await supabase
          .from(stat.table)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`Error fetching history for ${stat.table}:`, error);
          continue;
        }

        data.forEach(item => {
            let jenis = item.jenis_dokumen || item.nomor_surat || item.nomor || stat.title;
            const detailFields = Object.entries(item)
                .filter(([key]) => !['created_at', 'updated_at', 'file_url', 'file_name', 'id'].includes(key))
                .map(([key, value]) => ({ key: key, label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: value }));

             if (item.file_name && item.file_url) {
                 detailFields.push({ key: 'file_info', label: 'File', value: { fileName: item.file_name, fileUrl: item.file_url } });
             }
             if (item.created_at) {
                  detailFields.push({ key: 'created_at', label: 'Diunggah Pada', value: format(new Date(item.created_at), 'dd/MM/yyyy HH:mm') });
              }

          historyItems.push({
            id: item.id,
            table: stat.table,
            tanggal: item.tanggal || item.created_at,
            file_name: item.file_name || '',
            file_url: item.file_url || '',
            jenis: jenis,
            detailFields: detailFields,
            ...item,
          });
        });
      }
      historyItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setHistory(historyItems);

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching data:', err);
      toast.error(`Gagal memuat data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  const handleFileUpload = (fileUrl: string, fileName: string) => {
    setFormData(prev => ({ ...prev, file_url: fileUrl, file_name: fileName }));
    toast.success(`File ${fileName} berhasil diunggah sementara.`);
  }

  const handleCardClick = (formType: string) => {
    setFormData({});
    setActiveCard(formType);
    setViewMode('form'); // Set default ke form saat card diklik
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const currentCard = stats.find(stat => stat.formType === activeCard);
    if (!currentCard) {
        toast.error("Sistem tidak dapat mengidentifikasi tipe form.");
        setIsSubmitting(false);
        return;
    }

    const tableName = currentCard.table;
    let dataToSubmit: Partial<FormData> = { ...formData };

    try {
      if (!dataToSubmit.file_url || !dataToSubmit.file_name) {
        toast.error('File harus diupload terlebih dahulu');
        return;
      }

      let requiredFields: (keyof FormData)[] = ['tanggal', 'file_url', 'file_name'];
      if (activeCard === 'memorandum') {
          requiredFields = ['nomor_surat', 'dari', 'tanggal', 'file_url', 'file_name'];
      } else if (activeCard === 'arsip-dokumen-lain') {
           requiredFields = ['jenis_dokumen', 'tanggal', 'file_url', 'file_name'];
      } else {
           requiredFields = ['jenis_dokumen', 'tanggal', 'file_url', 'file_name'];
      }

      const missingFields = requiredFields.filter(field => !dataToSubmit[field]);

       if (missingFields.length > 0) {
           toast.error(`Field berikut harus diisi: ${missingFields.map(f => currentCard.fields?.find(cf => cf.key === f)?.label || f).join(', ')}`);
           return;
       }

      Object.keys(dataToSubmit).forEach(key => {
          const typedKey = key as keyof FormData;
          if (dataToSubmit[typedKey] === '') {
              delete dataToSubmit[typedKey];
          }
      });

      if (activeCard === 'memorandum') {
          if (formData.nomor_surat) dataToSubmit.nomor_surat = formData.nomor_surat;
          if (formData.dari) dataToSubmit.dari = formData.dari;
          if (formData.perihal) dataToSubmit.perihal = formData.perihal;
      } else if (activeCard === 'arsip-dokumen-lain') {
           if (formData.jenis_dokumen) dataToSubmit.jenis_dokumen = formData.jenis_dokumen;
           if (formData.perihal) dataToSubmit.perihal = formData.perihal;
           if (formData.nomor) dataToSubmit.nomor = formData.nomor;
      } else {
          if (formData.jenis_dokumen) dataToSubmit.jenis_dokumen = formData.jenis_dokumen;
      }


      console.log('Submitting to Supabase:', { tableName, dataToSubmit });

      const { error, data: insertedData } = await supabase
        .from(tableName)
        .insert([dataToSubmit])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
         if (error.code === '23505') {
            toast.error('Data dengan kombinasi kunci unik yang sama sudah ada.');
         } else {
            throw new Error(`Database error: ${error.message}`);
         }
         return;
      }

      toast.success('Data berhasil disimpan!');

      setStats(prevStats =>
        prevStats.map(stat =>
          stat.table === tableName
            ? { ...stat, value: stat.value + 1 }
            : stat
        )
      );

      if (insertedData) {
           const newItem = insertedData as FormData;
           // Menggunakan currentCard.title sebagai pengganti stat.title
           let jenis = newItem.jenis_dokumen || newItem.nomor_surat || currentCard.title;

           const detailFields = Object.entries(newItem)
               .filter(([key]) => !['created_at', 'updated_at', 'file_url', 'file_name', 'id'].includes(key))
                .map(([key, value]) => ({ key: key, label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: value }));

           // Memperbaiki tipe untuk file_info
           if (newItem.file_name && newItem.file_url) {
                detailFields.push({ 
                    key: 'file_info', 
                    label: 'File', 
                    value: { fileName: newItem.file_name, fileUrl: newItem.file_url } 
                });
           }
           
           // Memperbaiki format tanggal
           const createdAt = newItem.created_at || new Date().toISOString();
           detailFields.push({ 
               key: 'created_at', 
               label: 'Diunggah Pada', 
               value: format(new Date(createdAt), 'dd/MM/yyyy HH:mm') 
           });

          // Memperbaiki tipe untuk historyItem
          const historyItem: HistoryItem = {
               id: newItem.id || insertedData.id,
               table: tableName,
               tanggal: newItem.tanggal || createdAt,
               file_name: newItem.file_name || '',
               file_url: newItem.file_url || '',
               jenis: jenis,
               detailFields: detailFields,
               ...newItem,
          };
         setHistory(prev => [historyItem, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }


      setFormData({});
      setActiveCard(null);

    } catch (error) {
      console.error('Submit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';
      toast.error(`Gagal menyimpan data: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }


  const resetForm = () => {
    if (formData.file_url && formData.file_name) {
      const confirmReset = window.confirm(`File ${formData.file_name} sudah diupload. Yakin ingin membatalkan?`);
      if (!confirmReset) return;
    }

    setFormData({});
    setActiveCard(null);
  }

  const renderDetail = (item: HistoryItem) => {
      return item.detailFields.map(field => {
          // Memperbaiki pengecekan tipe untuk field.value
          if (field.key === 'file_info' && field.value && typeof field.value === 'object') {
              // Menambahkan type assertion untuk fileInfo
              const fileInfo = field.value as { fileName: string, fileUrl: string };
              return (
                  <div key={field.key} className="flex flex-col">
                      <span className="font-medium">{field.label}:</span>
                      <a href={fileInfo.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {fileInfo.fileName}
                      </a>
                  </div>
              );
          }
          return (
              <div key={field.key} className="flex flex-col">
                  <span className="font-medium">{field.label}:</span>
                  <span>{field.key === 'tanggal' && field.value ? new Date(field.value.toString()).toLocaleDateString('id-ID') : field.value?.toString() || '-'}</span>
              </div>
          );
      });
  };

  // Filter riwayat berdasarkan card yang aktif
  const filteredHistory = history.filter(item => {
    // Filter berdasarkan kartu yang aktif
    if (activeCard) {
      const activeCardConfig = stats.find(stat => stat.formType === activeCard);
      const activeTable = activeCardConfig?.table;
      if (activeTable && item.table !== activeTable) return false;
    }
    
    // Filter berdasarkan search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const typeTitle = stats.find(stat => stat.table === item.table)?.title.toLowerCase() || item.table.toLowerCase();
    const jenisDisplay = item.jenis?.toLowerCase() || '';

    return (
      typeTitle.includes(query) ||
      jenisDisplay.includes(query) ||
      item.file_name?.toLowerCase().includes(query) ||
       item.detailFields.some(field =>
           typeof field.value === 'string' && field.value.toLowerCase().includes(query)
       )
    );
  });

  const activeCardConfig = stats.find(stat => stat.formType === activeCard);


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Arsip Personalia & Umum</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <Card
            key={stat.table}
            className={`overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors ${
              activeCard === stat.formType ? 'border-blue-500 border-2' : ''
            }`}
            onClick={() => handleCardClick(stat.formType)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">Total dokumen terarsipkan</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mode Toggle Buttons */}
      {activeCard && (
        <div className="flex gap-2 mb-4">
          <Button 
            variant={viewMode === 'form' ? 'default' : 'outline'}
            onClick={() => setViewMode('form')}
          >
            Form Pengisian
          </Button>
          <Button 
            variant={viewMode === 'history' ? 'default' : 'outline'}
            onClick={() => setViewMode('history')}
          >
            Riwayat Upload
          </Button>
        </div>
      )}

      {/* Dynamic Form Card - Hanya tampil jika mode 'form' */}
      {activeCard && activeCardConfig && viewMode === 'form' && (
          <Card>
              <CardHeader>
                  <CardTitle>Unggah Dokumen: {activeCardConfig.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  {/* Render form fields dynamically based on activeCardConfig */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeCardConfig.fields?.map(field => (
                          <div key={String(field.key)}>
                              <Label htmlFor={String(field.key)}>{field.label} {['nomor_surat', 'dari', 'jenis_dokumen', 'tanggal'].includes(field.key as string) ? '*' : ''}</Label>
                              {field.type === 'text' && (
                                  <Input
                                      id={String(field.key)}
                                      value={String(formData[field.key] || '')}
                                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                                      placeholder={`Masukkan ${field.label.toLowerCase()}`}
                                  />
                              )}
                               {field.type === 'date' && (
                                  <Input
                                      id={String(field.key)}
                                      type="date"
                                      value={String(formData[field.key] || '')}
                                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                                  />
                              )}
                               {field.type === 'textarea' && (
                                  <Textarea
                                      id={String(field.key)}
                                      value={String(formData[field.key] || '')}
                                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                                      placeholder={`Masukkan ${field.label.toLowerCase()}`}
                                      rows={3}
                                  />
                              )}
                          </div>
                      ))}
                  </div>

                  <div>
                       <Label>File Dokumen *</Label>
                       <FileUpload
                           onUploadComplete={handleFileUpload}
                           folder={`personalia-umum/${activeCard}`}
                       />
                       {formData.file_name && (
                           <p className="text-sm text-green-600 mt-2">
                               ✓ File terupload: {formData.file_name}
                           </p>
                       )}
                  </div>

                   <div className="flex gap-2 pt-4">
                      <Button
                           onClick={handleSubmit}
                           disabled={isSubmitting || !formData.file_url}
                      >
                          {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                      <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>
                           Batal
                      </Button>
                   </div>

              </CardContent>
          </Card>
      )}


      {/* History Section - Hanya tampil jika mode 'history' */}
      {activeCard && viewMode === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Dokumen - {activeCardConfig?.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Cari jenis, nomor surat, nama file, dll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Jenis Arsip</TableHead>
                    <TableHead className="w-[150px]">Info Utama</TableHead>
                    <TableHead className="w-[120px]">Tanggal Dokumen</TableHead>
                    <TableHead>Nama File</TableHead>
                    <TableHead className="w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                       <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Memuat data...
                          </TableCell>
                      </TableRow>
                  ) : error ? (
                       <TableRow>
                          <TableCell colSpan={5} className="text-center text-red-500">
                              Terjadi kesalahan saat memuat data: {error}
                        </TableCell>
                      </TableRow>
                  ) : filteredHistory.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                               {searchQuery ? "Tidak ada dokumen yang sesuai dengan pencarian." : "Belum ada dokumen yang diunggah untuk kategori ini."}
                          </TableCell>
                      </TableRow>
                  ) : (
                      filteredHistory.map(item => (
                        <TableRow key={`${item.table}-${item.id}`}>
                          <TableCell className="font-medium">
                            {stats.find(stat => stat.table === item.table)?.title || item.table}
                          </TableCell>
                          <TableCell>{item.jenis || '-'}</TableCell>
                          <TableCell>{item.tanggal ? format(new Date(item.tanggal), 'dd/MM/yyyy') : '-'}</TableCell>
                          <TableCell>{item.file_name || '-'}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" /> Detail
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                  <DialogTitle>Detail Dokumen</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                  {renderDetail(item)}
                                </div>
                                {item.file_url && item.file_name && (
                                    <div className="border-t pt-4 mt-4">
                                         <p className="font-medium mb-2">Tautan File:</p>
                                         <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                             {item.file_name}
                                         </a>
                                    </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}