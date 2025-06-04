"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AlertCircle, Download, Eye, FileText, Search, Trash2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileUpload } from "@/components/file-upload"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { checkSupabaseConnection, testInsertData } from "@/utils/debug-supabase"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface SuratMasuk {
  id: string
  nomor_surat: string
  perihal: string
  disposisi_ke: string
  tanggal_surat: string
  jenis_surat: string
  instansi_pengirim: string
  diterima_tanggal: string
  bagian: string
  file_url: string
  file_name: string
  file_path: string
  created_at: string
}

interface DebugInfo {
  success: boolean
  error: string
}

export default function SuratMasukPage() {
  const [formData, setFormData] = useState({
    nomorSurat: "",
    perihal: "",
    disposisiKe: "",
    tanggalSurat: "",
    jenisSurat: "",
    instansiPengirim: "",
    diterimaTanggal: "",
    bagian: "",
  })
  const [fileUrl, setFileUrl] = useState("")
  const [fileName, setFileName] = useState("")
  const [filePath, setFilePath] = useState("")
  const [loading, setLoading] = useState(false)
  const [suratList, setSuratList] = useState<SuratMasuk[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedSurat, setSelectedSurat] = useState<SuratMasuk | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showDebugDialog, setShowDebugDialog] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [debugLoading, setDebugLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Fetch surat masuk data
  const fetchSuratMasuk = async () => {
    setIsLoading(true)
    try {
      let query = supabase.from("surat_masuk").select("*").order("created_at", { ascending: false })

      if (searchQuery) {
        query = query.or(
          `perihal.ilike.%${searchQuery}%,nomor_surat.ilike.%${searchQuery}%,instansi_pengirim.ilike.%${searchQuery}%`,
        )
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching data:", error)
        throw error
      }

      console.log("Fetched data:", data)
      setSuratList(data || [])
    } catch (error: any) {
      console.error("Error in fetchSuratMasuk:", error)
      toast({
        variant: "destructive",
        title: "Gagal mengambil data",
        description: error.message || "Terjadi kesalahan saat mengambil data surat masuk",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSuratMasuk()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileUploadComplete = (url: string, name: string, path: string) => {
    setFileUrl(url)
    setFileName(name)
    setFilePath(path)
    toast({
      title: "File berhasil diupload",
      description: "File telah siap untuk disimpan bersama data surat",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fileUrl) {
      toast({
        variant: "destructive",
        title: "File belum diupload",
        description: "Silahkan upload file terlebih dahulu",
      })
      return
    }

    setLoading(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User tidak ditemukan")
      }

      // Log data yang akan diinsert
      const dataToInsert = {
        nomor_surat: formData.nomorSurat,
        perihal: formData.perihal,
        disposisi_ke: formData.disposisiKe || null,
        tanggal_surat: formData.tanggalSurat,
        jenis_surat: formData.jenisSurat,
        instansi_pengirim: formData.instansiPengirim,
        diterima_tanggal: formData.diterimaTanggal,
        bagian: formData.bagian,
        file_url: fileUrl,
        file_name: fileName,
        file_path: filePath,
        created_by: user.id,
      }

      console.log("Data yang akan diinsert:", dataToInsert)

      // Save data to database
      const { data, error } = await supabase.from("surat_masuk").insert(dataToInsert).select()

      if (error) {
        console.error("Error inserting data:", error)
        throw error
      }

      console.log("Data berhasil diinsert:", data)

      toast({
        title: "Berhasil",
        description: "Surat masuk berhasil diarsipkan",
      })

      // Reset form
      setFormData({
        nomorSurat: "",
        perihal: "",
        disposisiKe: "",
        tanggalSurat: "",
        jenisSurat: "",
        instansiPengirim: "",
        diterimaTanggal: "",
        bagian: "",
      })
      setFileUrl("")
      setFileName("")
      setFilePath("")

      // Switch to list tab and refresh data
      setActiveTab("list")
      fetchSuratMasuk()
    } catch (error: any) {
      console.error("Error in handleSubmit:", error)
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message || "Terjadi kesalahan saat mengarsipkan surat",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewSurat = (surat: SuratMasuk) => {
    setSelectedSurat(surat)
    setShowViewDialog(true)
  }

  const handleDeleteSurat = (surat: SuratMasuk) => {
    setSelectedSurat(surat)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedSurat) return

    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage.from("sipeta").remove([selectedSurat.file_path])

      if (storageError) {
        throw storageError
      }

      // Delete record from database
      const { error: dbError } = await supabase.from("surat_masuk").delete().eq("id", selectedSurat.id)

      if (dbError) {
        throw dbError
      }

      toast({
        title: "Berhasil",
        description: "Surat masuk berhasil dihapus",
      })

      // Refresh data
      fetchSuratMasuk()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message || "Terjadi kesalahan saat menghapus surat",
      })
    } finally {
      setShowDeleteDialog(false)
      setSelectedSurat(null)
    }
  }

  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: id })
    } catch (error) {
      return dateString
    }
  }

  const runDiagnostics = async () => {
    setDebugLoading(true)
    try {
      // Check connection and table
      const connectionInfo = await checkSupabaseConnection()

      // Test insert if connected
      let insertInfo: { success: boolean; error: string; data?: any } = {
        success: false,
        error: "Not attempted",
      }

      if (connectionInfo.connected && connectionInfo.tableExists) {
        const result = await testInsertData()
        insertInfo = {
          success: result.success,
          error: result.error || "",
          data: result.data,
        }
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setDebugInfo({
        timestamp: new Date().toISOString(),
        connection: connectionInfo,
        insertTest: insertInfo,
        user: user ? { id: user.id, email: user.email } : null,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      })
    } catch (error: any) {
      setDebugInfo({
        error: error.message,
        stack: error.stack,
      })
    } finally {
      setDebugLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Arsip Surat Masuk</h1>
          <p className="text-muted-foreground">Kelola arsip surat masuk di sini</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowDebugDialog(true)} type="button">
          <Info className="h-4 w-4 mr-2" />
          Diagnostik
        </Button>
      </div>

      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Upload Surat</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>Daftar Surat</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Upload Surat Masuk</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Informasi</AlertTitle>
                <AlertDescription>
                  Silahkan isi formulir berikut untuk mengarsipkan surat masuk. Pastikan semua data terisi dengan benar.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nomorSurat">Nomor Surat Masuk</Label>
                    <Input
                      id="nomorSurat"
                      name="nomorSurat"
                      value={formData.nomorSurat}
                      onChange={handleChange}
                      placeholder="Masukkan nomor surat"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perihal">Perihal/Hal</Label>
                    <Input
                      id="perihal"
                      name="perihal"
                      value={formData.perihal}
                      onChange={handleChange}
                      placeholder="Masukkan perihal surat"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disposisiKe">Disposisi Ke-</Label>
                    <Input
                      id="disposisiKe"
                      name="disposisiKe"
                      value={formData.disposisiKe}
                      onChange={handleChange}
                      placeholder="Masukkan disposisi"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tanggalSurat">Tanggal Surat</Label>
                    <Input
                      id="tanggalSurat"
                      name="tanggalSurat"
                      type="date"
                      value={formData.tanggalSurat}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jenisSurat">Jenis Surat</Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("jenisSurat", value)}
                      value={formData.jenisSurat}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis surat" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Surat Internal Perusahaan</SelectItem>
                        <SelectItem value="pihak3">Surat Pihak Ke-3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instansiPengirim">Instansi Pengirim</Label>
                    <Input
                      id="instansiPengirim"
                      name="instansiPengirim"
                      value={formData.instansiPengirim}
                      onChange={handleChange}
                      placeholder="Masukkan instansi pengirim"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diterimaTanggal">Diterima Tanggal</Label>
                    <Input
                      id="diterimaTanggal"
                      name="diterimaTanggal"
                      type="date"
                      value={formData.diterimaTanggal}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bagian">Bagian</Label>
                    <Select onValueChange={(value) => handleSelectChange("bagian", value)} value={formData.bagian}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bagian" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sdm">SDM</SelectItem>
                        <SelectItem value="akuntansi">Akuntansi & Keuangan</SelectItem>
                        <SelectItem value="tanaman">Tanaman</SelectItem>
                        <SelectItem value="teknik">Teknik & Pengolahan</SelectItem>
                        <SelectItem value="pengadaan">Pengadaan & TI</SelectItem>
                        <SelectItem value="sekhum">Sekhum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <FileUpload
                    onUploadComplete={handleFileUploadComplete}
                    acceptedFileTypes=".pdf,.docx,.doc,.xls,.xlsx,.jpg,.jpeg,.png"
                    maxSizeMB={10}
                    folder="surat-masuk"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700"
                  disabled={loading || !fileUrl}
                >
                  {loading ? "Menyimpan..." : "Simpan Arsip Surat"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card className="shadow-md">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Daftar Surat Masuk</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari surat..."
                  className="pl-8 w-full md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : suratList.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="py-3 px-4 text-left font-medium">Nomor Surat</th>
                          <th className="py-3 px-4 text-left font-medium">Perihal</th>
                          <th className="py-3 px-4 text-left font-medium">Instansi Pengirim</th>
                          <th className="py-3 px-4 text-left font-medium">Tanggal</th>
                          <th className="py-3 px-4 text-left font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {suratList.map((surat) => (
                          <tr key={surat.id} className="hover:bg-muted/30">
                            <td className="py-3 px-4 font-medium">{surat.nomor_surat}</td>
                            <td className="py-3 px-4 max-w-[200px] truncate">{surat.perihal}</td>
                            <td className="py-3 px-4">{surat.instansi_pengirim}</td>
                            <td className="py-3 px-4">{formatDate(surat.tanggal_surat)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewSurat(surat)}
                                  title="Lihat Detail"
                                  type="button"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => downloadFile(surat.file_url, surat.file_name)}
                                  title="Download"
                                  type="button"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSurat(surat)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  title="Hapus"
                                  type="button"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Tidak ada hasil yang ditemukan." : "Belum ada data surat masuk."}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detail Surat Masuk</DialogTitle>
            <DialogDescription>Informasi lengkap tentang surat masuk</DialogDescription>
          </DialogHeader>

          {selectedSurat && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Nomor Surat</p>
                <p className="text-sm">{selectedSurat.nomor_surat}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Perihal</p>
                <p className="text-sm">{selectedSurat.perihal}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Disposisi Ke</p>
                <p className="text-sm">{selectedSurat.disposisi_ke || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Tanggal Surat</p>
                <p className="text-sm">{formatDate(selectedSurat.tanggal_surat)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Jenis Surat</p>
                <p className="text-sm">
                  {selectedSurat.jenis_surat === "internal" ? "Surat Internal Perusahaan" : "Surat Pihak Ke-3"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Instansi Pengirim</p>
                <p className="text-sm">{selectedSurat.instansi_pengirim}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Diterima Tanggal</p>
                <p className="text-sm">{formatDate(selectedSurat.diterima_tanggal)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Bagian</p>
                <p className="text-sm">{selectedSurat.bagian}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm font-medium">File</p>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <p className="text-sm">{selectedSurat.file_name}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedSurat) {
                  downloadFile(selectedSurat.file_url, selectedSurat.file_name)
                }
              }}
              type="button"
            >
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
            <Button onClick={() => setShowViewDialog(false)} type="button">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus surat ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} type="button">
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete} type="button">
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Debug Dialog */}
      <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Diagnostik Supabase</DialogTitle>
            <DialogDescription>
              Informasi diagnostik untuk membantu menyelesaikan masalah koneksi dan penyimpanan data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button onClick={runDiagnostics} disabled={debugLoading} type="button">
              {debugLoading ? "Menjalankan Diagnostik..." : "Jalankan Diagnostik"}
            </Button>

            {debugInfo && (
              <div className="border rounded-md p-4 bg-muted/30 space-y-4">
                <div>
                  <h3 className="font-medium">Waktu Diagnostik</h3>
                  <p className="text-sm">{debugInfo.timestamp}</p>
                </div>

                <div>
                  <h3 className="font-medium">Koneksi Supabase</h3>
                  <pre className="text-xs bg-black text-white p-2 rounded-md overflow-auto mt-2">
                    {JSON.stringify(debugInfo.connection, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium">Test Insert Data</h3>
                  <pre className="text-xs bg-black text-white p-2 rounded-md overflow-auto mt-2">
                    {JSON.stringify(debugInfo.insertTest, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium">User Info</h3>
                  <pre className="text-xs bg-black text-white p-2 rounded-md overflow-auto mt-2">
                    {JSON.stringify(debugInfo.user, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium">Supabase URL</h3>
                  <p className="text-sm">{debugInfo.supabaseUrl}</p>
                </div>

                {debugInfo.error && (
                  <div>
                    <h3 className="font-medium text-red-500">Error</h3>
                    <pre className="text-xs bg-black text-white p-2 rounded-md overflow-auto mt-2">
                      {debugInfo.error}
                      {debugInfo.stack && `\n\n${debugInfo.stack}`}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-medium">Langkah-langkah Pemecahan Masalah</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                  Pastikan tabel <code className="bg-muted px-1 rounded">surat_masuk</code> sudah dibuat di Supabase
                </li>
                <li>Periksa apakah RLS (Row Level Security) sudah dikonfigurasi dengan benar</li>
                <li>Pastikan user memiliki izin untuk menyisipkan data ke tabel</li>
                <li>Periksa apakah semua kolom yang diperlukan sudah ada di tabel</li>
                <li>Pastikan format data yang dikirim sesuai dengan tipe data di tabel</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">SQL untuk Membuat Tabel</h3>
              <pre className="text-xs bg-black text-white p-2 rounded-md overflow-auto">
                {`-- Tabel untuk surat masuk
CREATE TABLE IF NOT EXISTS surat_masuk (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomor_surat TEXT NOT NULL,
  perihal TEXT NOT NULL,
  disposisi_ke TEXT,
  tanggal_surat DATE NOT NULL,
  jenis_surat TEXT NOT NULL,
  instansi_pengirim TEXT NOT NULL,
  diterima_tanggal DATE NOT NULL,
  bagian TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tambahkan RLS (Row Level Security) untuk tabel
ALTER TABLE surat_masuk ENABLE ROW LEVEL SECURITY;

-- Buat kebijakan untuk mengizinkan semua pengguna yang terautentikasi untuk melihat semua data
CREATE POLICY "Semua pengguna dapat melihat surat masuk" ON surat_masuk
  FOR SELECT USING (auth.role() = 'authenticated');

-- Buat kebijakan untuk mengizinkan pengguna yang terautentikasi untuk menyisipkan data
CREATE POLICY "Pengguna dapat menyisipkan surat masuk" ON surat_masuk
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');`}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowDebugDialog(false)} type="button">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
