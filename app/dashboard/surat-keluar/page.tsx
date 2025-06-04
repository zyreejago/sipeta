"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AlertCircle, Download, Eye, FileText, Search, Trash2 } from "lucide-react"
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
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface SuratKeluar {
  id: string
  nomor_surat: string
  perihal: string
  tanggal_surat: string
  jenis_surat: string
  tujuan: string
  file_url: string
  file_name: string
  file_path: string
  created_at: string
}

export default function SuratKeluarPage() {
  const [formData, setFormData] = useState({
    nomorSurat: "",
    perihal: "",
    tanggalSurat: "",
    jenisSurat: "",
    tujuan: "",
  })
  const [fileUrl, setFileUrl] = useState("")
  const [fileName, setFileName] = useState("")
  const [filePath, setFilePath] = useState("")
  const [loading, setLoading] = useState(false)
  const [suratList, setSuratList] = useState<SuratKeluar[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedSurat, setSelectedSurat] = useState<SuratKeluar | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Fetch surat keluar data
  const fetchSuratKeluar = async () => {
    setIsLoading(true)
    try {
      let query = supabase.from("surat_keluar").select("*").order("created_at", { ascending: false })

      if (searchQuery) {
        query = query.or(
          `perihal.ilike.%${searchQuery}%,nomor_surat.ilike.%${searchQuery}%,tujuan.ilike.%${searchQuery}%`,
        )
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setSuratList(data || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal mengambil data",
        description: error.message || "Terjadi kesalahan saat mengambil data surat keluar",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSuratKeluar()
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

      // Save data to database
      const { error } = await supabase.from("surat_keluar").insert({
        nomor_surat: formData.nomorSurat,
        perihal: formData.perihal,
        tanggal_surat: formData.tanggalSurat,
        jenis_surat: formData.jenisSurat,
        tujuan: formData.tujuan,
        file_url: fileUrl,
        file_name: fileName,
        file_path: filePath,
        created_by: user.id,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Berhasil",
        description: "Surat keluar berhasil diarsipkan",
      })

      // Reset form
      setFormData({
        nomorSurat: "",
        perihal: "",
        tanggalSurat: "",
        jenisSurat: "",
        tujuan: "",
      })
      setFileUrl("")
      setFileName("")
      setFilePath("")

      // Switch to list tab and refresh data
      setActiveTab("list")
      fetchSuratKeluar()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message || "Terjadi kesalahan saat mengarsipkan surat",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewSurat = (surat: SuratKeluar) => {
    setSelectedSurat(surat)
    setShowViewDialog(true)
  }

  const handleDeleteSurat = (surat: SuratKeluar) => {
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
      const { error: dbError } = await supabase.from("surat_keluar").delete().eq("id", selectedSurat.id)

      if (dbError) {
        throw dbError
      }

      toast({
        title: "Berhasil",
        description: "Surat keluar berhasil dihapus",
      })

      // Refresh data
      fetchSuratKeluar()
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

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Arsip Surat Keluar</h1>
          <p className="text-muted-foreground">Kelola arsip surat keluar di sini</p>
        </div>
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
              <CardTitle>Upload Surat Keluar</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Informasi</AlertTitle>
                <AlertDescription>
                  Silahkan isi formulir berikut untuk mengarsipkan surat keluar. Pastikan semua data terisi dengan
                  benar.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nomorSurat">Nomor Surat</Label>
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
                    <Label htmlFor="tujuan">Tujuan</Label>
                    <Input
                      id="tujuan"
                      name="tujuan"
                      value={formData.tujuan}
                      onChange={handleChange}
                      placeholder="Masukkan tujuan surat"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <FileUpload
                    onUploadComplete={handleFileUploadComplete}
                    acceptedFileTypes=".pdf,.docx,.doc,.xls,.xlsx,.jpg,.jpeg,.png"
                    maxSizeMB={10}
                    folder="surat-keluar"
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
              <CardTitle>Daftar Surat Keluar</CardTitle>
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
                          <th className="py-3 px-4 text-left font-medium">Tujuan</th>
                          <th className="py-3 px-4 text-left font-medium">Tanggal</th>
                          <th className="py-3 px-4 text-left font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {suratList.map((surat) => (
                          <tr key={surat.id} className="hover:bg-muted/30">
                            <td className="py-3 px-4 font-medium">{surat.nomor_surat}</td>
                            <td className="py-3 px-4 max-w-[200px] truncate">{surat.perihal}</td>
                            <td className="py-3 px-4">{surat.tujuan}</td>
                            <td className="py-3 px-4">{formatDate(surat.tanggal_surat)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewSurat(surat)}
                                  title="Lihat Detail"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => downloadFile(surat.file_url, surat.file_name)}
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSurat(surat)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  title="Hapus"
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
                  {searchQuery ? "Tidak ada hasil yang ditemukan." : "Belum ada data surat keluar."}
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
            <DialogTitle>Detail Surat Keluar</DialogTitle>
            <DialogDescription>Informasi lengkap tentang surat keluar</DialogDescription>
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
                <p className="text-sm font-medium">Tujuan</p>
                <p className="text-sm">{selectedSurat.tujuan}</p>
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
            >
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
            <Button onClick={() => setShowViewDialog(false)}>Tutup</Button>
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
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
