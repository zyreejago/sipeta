import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TutorialPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tutorial Penggunaan Aplikasi</h1>

      <Card>
        <CardHeader>
          <CardTitle>Panduan Penggunaan SIPETA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">1. Login ke Sistem</h3>
            <p className="text-muted-foreground">
              Masukkan username dan password yang telah diberikan oleh administrator.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium">2. Mengarsipkan Dokumen</h3>
            <p className="text-muted-foreground">
              Pilih menu File Upload, kemudian pilih jenis arsip yang ingin diupload. Isi formulir dengan lengkap dan
              upload file dokumen.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium">3. Melihat Dokumen Terarsip</h3>
            <p className="text-muted-foreground">
              Pilih menu File Upload, kemudian pilih jenis arsip yang ingin dilihat. Klik tab "Daftar Surat" untuk
              melihat dokumen yang telah diarsipkan.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
