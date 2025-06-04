import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Aplikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">Halaman ini akan menampilkan pengaturan aplikasi.</p>
        </CardContent>
      </Card>
    </div>
  )
}
