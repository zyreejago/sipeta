"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/file-upload"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { BarChart3, FileText, Package, PackageOpen, MessageSquare, Eye, Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type FormData = {
  bukti_dokumen?: string
  nomor_voucher?: string
  uraian_perihal?: string
  penerima?: string
  nominal?: number
  dibuat_oleh?: string
  tanggal?: string
  diterima_dari?: string
  nomor?: string
  jenis_barang?: string
  kebun?: string
  bagian?: string
  tanggal_diminta?: string
  nomor_surat?: string
  dari?: string
  perihal?: string
  jenis_dokumen?: string
  file_url?: string
  file_name?: string
  [key: string]: string | number | undefined
}

type HistoryItem = {
  id: string
  table: string
  nomor: string
  tanggal: string
  file_name: string
  file_url?: string
  [key: string]: any
}

export default function TataUsahaKeuanganPage() {
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const [activeSubOption, setActiveSubOption] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState([
    { title: "Bukti Kas & Bank", value: 0, icon: BarChart3, color: "bg-blue-100 text-blue-700", table: "bukti_kas_bank" },
    { title: "Bukti Penerimaan Barang", value: 0, icon: Package, color: "bg-green-100 text-green-700", table: "bukti_penerimaan_barang" },
    { title: "Bukti Pengeluaran Barang", value: 0, icon: PackageOpen, color: "bg-purple-100 text-purple-700", table: "bukti_pengeluaran_barang" },
    { title: "Memorandum", value: 0, icon: MessageSquare, color: "bg-yellow-100 text-yellow-700", table: "memorandum" },
    { title: "Arsip Dokumen Lain", value: 0, icon: FileText, color: "bg-pink-100 text-pink-700", table: "arsip_dokumen_lain" },
  ])
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const updatedStats = await Promise.all(
          stats.map(async (stat) => {
            const { count, error } = await supabase
              .from(stat.table)
              .select('*', { count: 'exact', head: true })
            
            if (error) {
              console.error(`Error fetching ${stat.table}:`, error)
              return stat
            }
            
            return { ...stat, value: count || 0 }
          })
        )
        setStats(updatedStats)
      } catch (error) {
        console.error('Error fetching statistics:', error)
      }
    }

    const fetchHistory = async () => {
      try {
        const historyItems: HistoryItem[] = []
        for (const stat of stats) {
          const { data, error } = await supabase
            .from(stat.table)
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error(`Error fetching ${stat.table}:`, error)
            continue
          }

          data.forEach(item => {
            let nomor = ''
            if (stat.table === 'bukti_kas_bank') nomor = item.nomor_voucher || ''
            else if (stat.table === 'memorandum') nomor = item.nomor_surat || ''
            else nomor = item.nomor || ''

            historyItems.push({
              id: item.id,
              table: stat.table,
              nomor,
              tanggal: item.tanggal || item.created_at,
              file_name: item.file_name || '',
              file_url: item.file_url || '',
              ...item
            })
          })
        }
        setHistory(historyItems)
      } catch (error) {
        console.error('Error fetching history:', error)
      }
    }

    fetchStats()
    fetchHistory()
  }, [])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (fileUrl: string, fileName: string) => {
    setFormData(prev => ({ ...prev, file_url: fileUrl, file_name: fileName }))
    console.log('File uploaded:', { fileUrl, fileName })
  }

  const handleCardClick = (cardType: string) => {
    console.log('Card clicked:', cardType, 'Current activeCard:', activeCard)
    setFormData({})
    setActiveSubOption(null)
    // Ganti semua underscore dengan dash
    const formattedCardType = cardType.replace(/_/g, '-')
    setActiveCard(activeCard === formattedCardType ? null : formattedCardType)
  }

  const handleSubOptionSelect = (option: string) => {
    setActiveSubOption(option)
    setFormData(prev => ({ ...prev, bukti_dokumen: option }))
  }

  const handleSubmit = async (type: string) => {
    setIsSubmitting(true)
    
    try {
      console.log('Starting submit process...', { type, formData })
      
      if (!formData.file_url) {
        toast.error('File harus diupload terlebih dahulu')
        return
      }

      let tableName = ''
      let data = { ...formData }
      
      Object.keys(data).forEach(key => {
        const typedKey = key as keyof FormData
        if (data[typedKey] === undefined || data[typedKey] === '' || data[typedKey] === null) {
          delete data[typedKey]
        }
      })
      
      switch (type) {
        case 'bukti-kas-bank':
          tableName = 'bukti_kas_bank'
          if (!data.bukti_dokumen || !data.nomor_voucher) {
            toast.error('Bukti dokumen dan nomor voucher harus diisi')
            return
          }
          break
        case 'bukti-penerimaan-barang':
          tableName = 'bukti_penerimaan_barang'
          if (!data.diterima_dari || !data.jenis_barang) {
            toast.error('Diterima dari dan jenis barang harus diisi')
            return
          }
          break
        case 'bukti-pengeluaran-barang':
          tableName = 'bukti_pengeluaran_barang'
          if (!data.kebun || !data.bagian) {
            toast.error('Kebun dan bagian harus diisi')
            return
          }
          break
        case 'memorandum':
          tableName = 'memorandum'
          if (!data.nomor_surat || !data.dari) {
            toast.error('Nomor surat dan dari harus diisi')
            return
          }
          break
        case 'arsip-dokumen-lain':
          tableName = 'arsip_dokumen_lain'
          if (!data.jenis_dokumen) {
            toast.error('Jenis dokumen harus diisi')
            return
          }
          break
      }
      
      console.log('Submitting to Supabase:', { tableName, data })
      
      const { error, data: insertedData } = await supabase
        .from(tableName)
        .insert([data])
        .select()
      
      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Database error: ${error.message}`)
      }
      
      toast.success('Data berhasil disimpan!')
      
      const uploadedFile = { file_url: formData.file_url, file_name: formData.file_name }
      setFormData({})
      setActiveCard(null)
      setActiveSubOption(null)
      
      if (uploadedFile.file_name) {
        toast.success(`File ${uploadedFile.file_name} berhasil diarsipkan`)
      }
      
      setStats(prevStats => 
        prevStats.map(stat => 
          stat.table === tableName 
            ? { ...stat, value: stat.value + 1 }
            : stat
        )
      )

      if (insertedData && insertedData[0]) {
        const newItem = insertedData[0]
        let nomor = ''
        if (tableName === 'bukti_kas_bank') nomor = newItem.nomor_voucher || ''
        else if (tableName === 'memorandum') nomor = newItem.nomor_surat || ''
        else nomor = newItem.nomor || ''

        setHistory(prev => [{
          id: newItem.id,
          table: tableName,
          nomor,
          tanggal: newItem.tanggal || newItem.created_at,
          file_name: newItem.file_name || '',
          file_url: newItem.file_url || '',
          ...newItem
        }, ...prev])
      }
    } catch (error) {
      console.error('Submit error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui'
      toast.error(`Gagal menyimpan data: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    if (formData.file_url && formData.file_name) {
      const confirmReset = window.confirm(`File ${formData.file_name} sudah diupload. Yakin ingin membatalkan?`)
      if (!confirmReset) return
    }
    
    setFormData({})
    setActiveCard(null)
    setActiveSubOption(null)
  }

  const renderDetail = (item: HistoryItem) => {
    const fields = Object.entries(item).filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
    return fields.map(([key, value]) => {
      if (key === 'file_url' && item.file_name) {
        return (
          <div key={key} className="flex flex-col">
            <span className="font-medium">File:</span>
            <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {item.file_name}
            </a>
          </div>
        )
      }
      return (
        <div key={key} className="flex flex-col">
          <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
          <span>{key === 'tanggal' && value ? new Date(value).toLocaleDateString('id-ID') : value?.toString() || '-'}</span>
        </div>
      )
    })
  }

  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const type = stats.find(stat => stat.table === item.table)?.title.toLowerCase() || ''
    return (
      type.includes(query) ||
      item.nomor?.toLowerCase().includes(query) ||
      item.file_name?.toLowerCase().includes(query) ||
      Object.values(item).some(val => 
        typeof val === 'string' && val.toLowerCase().includes(query)
      )
    )
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Arsip Tata Usaha & Keuangan</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <Card 
            key={stat.table} 
            className={`overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors ${activeCard === stat.table.replace('_', '-') ? 'border-500 border-2' : ''}`}
            onClick={() => handleCardClick(stat.table.replace('_', '-'))}
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

      {/* Form: Bukti Kas & Bank */}
      {activeCard === 'bukti-kas-bank' && (
        <Card>
          <CardHeader>
            <CardTitle>Bukti Kas & Bank</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!activeSubOption && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 text-left flex flex-col items-start justify-center"
                  onClick={() => handleSubOptionSelect('penerimaan-kas')}
                >
                  <span className="font-semibold">Bukti Penerimaan Kas</span>
                  <span className="text-sm text-muted-foreground">Dokumen penerimaan kas masuk</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 text-left flex flex-col items-start justify-center"
                  onClick={() => handleSubOptionSelect('pengeluaran-kas')}
                >
                  <span className="font-semibold">Bukti Pengeluaran Kas</span>
                  <span className="text-sm text-muted-foreground">Dokumen pengeluaran kas keluar</span>
                </Button>
              </div>
            )}
            
            {activeSubOption && (
              <>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    Jenis: {activeSubOption === 'penerimaan-kas' ? 'Bukti Penerimaan Kas' : 'Bukti Pengeluaran Kas'}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveSubOption(null)}
                    className="mt-1 text-blue-600 hover:text-blue-800"
                  >
                    ← Ganti Jenis
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nomor_voucher">Nomor Voucher *</Label>
                    <Input 
                      id="nomor_voucher"
                      value={formData.nomor_voucher || ''}
                      onChange={(e) => handleInputChange('nomor_voucher', e.target.value)}
                      placeholder="Masukkan nomor voucher"
                    />
                  </div>
                  <div>
                    <Label htmlFor="uraian_perihal">Uraian/Perihal *</Label>
                    <Textarea 
                      id="uraian_perihal"
                      value={formData.uraian_perihal || ''}
                      onChange={(e) => handleInputChange('uraian_perihal', e.target.value)}
                      placeholder="Masukkan uraian/perihal"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="penerima">Penerima</Label>
                    <Input 
                      id="penerima"
                      value={formData.penerima || ''}
                      onChange={(e) => handleInputChange('penerima', e.target.value)}
                      placeholder="Masukkan nama penerima"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nominal">Nominal</Label>
                    <Input 
                      id="nominal"
                      type="number"
                      value={formData.nominal || ''}
                      onChange={(e) => handleInputChange('nominal', parseFloat(e.target.value) || 0)}
                      placeholder="Masukkan nominal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dibuat_oleh">Dibuat Oleh</Label>
                    <Input 
                      id="dibuat_oleh"
                      value={formData.dibuat_oleh || ''}
                      onChange={(e) => handleInputChange('dibuat_oleh', e.target.value)}
                      placeholder="Masukkan nama pembuat"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tanggal">Tanggal</Label>
                    <Input 
                      id="tanggal"
                      type="date"
                      value={formData.tanggal || ''}
                      onChange={(e) => handleInputChange('tanggal', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>File Upload *</Label>
                  <FileUpload 
                    onUploadComplete={handleFileUpload}
                    folder="tata-usaha-keuangan/bukti-kas-bank"
                  />
                  {formData.file_name && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ File terupload: {formData.file_name}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleSubmit('bukti-kas-bank')}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form: Bukti Penerimaan Barang */}
      {activeCard === 'bukti-penerimaan-barang' && (
        <Card>
          <CardHeader>
            <CardTitle>Bukti Penerimaan Barang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="diterima_dari">Diterima dari *</Label>
                <Input 
                  id="diterima_dari"
                  value={formData.diterima_dari || ''}
                  onChange={(e) => handleInputChange('diterima_dari', e.target.value)}
                  placeholder="Masukkan asal barang"
                />
              </div>
              <div>
                <Label htmlFor="nomor">Nomor</Label>
                <Input 
                  id="nomor"
                  value={formData.nomor || ''}
                  onChange={(e) => handleInputChange('nomor', e.target.value)}
                  placeholder="Masukkan nomor"
                />
              </div>
              <div>
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input 
                  id="tanggal"
                  type="date"
                  value={formData.tanggal || ''}
                  onChange={(e) => handleInputChange('tanggal', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="jenis_barang">Jenis Barang *</Label>
                <Input 
                  id="jenis_barang"
                  value={formData.jenis_barang || ''}
                  onChange={(e) => handleInputChange('jenis_barang', e.target.value)}
                  placeholder="Masukkan jenis barang"
                />
              </div>
            </div>
            
            <div>
              <Label>File Upload *</Label>
              <FileUpload 
                onUploadComplete={handleFileUpload}
                folder="tata-usaha-keuangan/bukti-penerimaan-barang"
              />
              {formData.file_name && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ File terupload: {formData.file_name}
                </p>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => handleSubmit('bukti-penerimaan-barang')}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form: Bukti Pengeluaran Barang */}
      {activeCard === 'bukti-pengeluaran-barang' && (
        <Card>
          <CardHeader>
            <CardTitle>Bukti Pengeluaran Barang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kebun">Kebun *</Label>
                <Input 
                  id="kebun"
                  value={formData.kebun || ''}
                  onChange={(e) => handleInputChange('kebun', e.target.value)}
                  placeholder="Masukkan nama kebun"
                />
              </div>
              <div>
                <Label htmlFor="bagian">Bagian *</Label>
                <Input 
                  id="bagian"
                  value={formData.bagian || ''}
                  onChange={(e) => handleInputChange('bagian', e.target.value)}
                  placeholder="Masukkan bagian"
                />
              </div>
              <div>
                <Label htmlFor="nomor">Nomor</Label>
                <Input 
                  id="nomor"
                  value={formData.nomor || ''}
                  onChange={(e) => handleInputChange('nomor', e.target.value)}
                  placeholder="Masukkan nomor"
                />
              </div>
              <div>
                <Label htmlFor="tanggal_diminta">Tanggal Diminta</Label>
                <Input 
                  id="tanggal_diminta"
                  type="date"
                  value={formData.tanggal_diminta || ''}
                  onChange={(e) => handleInputChange('tanggal_diminta', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="jenis_barang">Jenis Barang</Label>
                <Input 
                  id="jenis_barang"
                  value={formData.jenis_barang || ''}
                  onChange={(e) => handleInputChange('jenis_barang', e.target.value)}
                  placeholder="Masukkan jenis barang"
                />
              </div>
            </div>
            
            <div>
              <Label>File Upload *</Label>
              <FileUpload 
                onUploadComplete={handleFileUpload}
                folder="tata-usaha-keuangan/bukti-pengeluaran-barang"
              />
              {formData.file_name && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ File terupload: {formData.file_name}
                </p>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => handleSubmit('bukti-pengeluaran-barang')}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form: Memorandum */}
      {activeCard === 'memorandum' && (
        <Card>
          <CardHeader>
            <CardTitle>Memorandum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomor_surat">Nomor Surat *</Label>
                <Input 
                  id="nomor_surat"
                  value={formData.nomor_surat || ''}
                  onChange={(e) => handleInputChange('nomor_surat', e.target.value)}
                  placeholder="Masukkan nomor surat"
                />
              </div>
              <div>
                <Label htmlFor="dari">Dari *</Label>
                <Input 
                  id="dari"
                  value={formData.dari || ''}
                  onChange={(e) => handleInputChange('dari', e.target.value)}
                  placeholder="Masukkan pengirim"
                />
              </div>
              <div>
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input 
                  id="tanggal"
                  type="date"
                  value={formData.tanggal || ''}
                  onChange={(e) => handleInputChange('tanggal', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="perihal">Perihal</Label>
                <Textarea 
                  id="perihal"
                  value={formData.perihal || ''}
                  onChange={(e) => handleInputChange('perihal', e.target.value)}
                  placeholder="Masukkan perihal (opsional)"
                  rows={3}
                />
              </div>
            </div>
            
            <div>
              <Label>File Upload *</Label>
              <FileUpload 
                onUploadComplete={handleFileUpload}
                folder="tata-usaha-keuangan/memorandum"
              />
              {formData.file_name && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ File terupload: {formData.file_name}
                </p>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => handleSubmit('memorandum')}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form: Arsip Dokumen Lain */}
      {activeCard === 'arsip-dokumen-lain' && (
        <Card>
          <CardHeader>
            <CardTitle>Arsip Dokumen Lain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jenis_dokumen">Jenis Dokumen *</Label>
                <Input 
                  id="jenis_dokumen"
                  value={formData.jenis_dokumen || ''}
                  onChange={(e) => handleInputChange('jenis_dokumen', e.target.value)}
                  placeholder="Masukkan jenis dokumen"
                />
              </div>
              <div>
                <Label htmlFor="nomor">Nomor</Label>
                <Input 
                  id="nomor"
                  value={formData.nomor || ''}
                  onChange={(e) => handleInputChange('nomor', e.target.value)}
                  placeholder="Masukkan nomor dokumen"
                />
              </div>
              <div>
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input 
                  id="tanggal"
                  type="date"
                  value={formData.tanggal || ''}
                  onChange={(e) => handleInputChange('tanggal', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="perihal">Keterangan</Label>
                <Textarea 
                  id="perihal"
                  value={formData.perihal || ''}
                  onChange={(e) => handleInputChange('perihal', e.target.value)}
                  placeholder="Masukkan keterangan (opsional)"
                  rows={3}
                />
              </div>
            </div>
            
            <div>
              <Label>File Upload *</Label>
              <FileUpload 
                onUploadComplete={handleFileUpload}
                folder="tata-usaha-keuangan/arsip-dokumen-lain"
              />
              {formData.file_name && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ File terupload: {formData.file_name}
                </p>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => handleSubmit('arsip-dokumen-lain')}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Dokumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Cari jenis, nomor, file, dll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jenis Dokumen</TableHead>
                <TableHead>Nomor</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map(item => (
                <TableRow key={`${item.table}-${item.id}`}>
                  <TableCell>
                    {stats.find(stat => stat.table === item.table)?.title || item.table}
                  </TableCell>
                  <TableCell>{item.nomor || '-'}</TableCell>
                  <TableCell>{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{item.file_name || '-'}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" /> Detail
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detail Dokumen</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderDetail(item)}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredHistory.length === 0 && (
            <p className="text-center text-muted-foreground mt-4">
              {searchQuery ? "Tidak ada dokumen yang sesuai dengan pencarian." : "Belum ada dokumen yang diunggah."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}