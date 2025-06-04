import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SuratInternPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Arsip Surat Intern</h1>

      <Card>
        <CardHeader>
          <CardTitle>Arsip Surat Intern</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">Halaman ini akan menampilkan arsip surat intern.</p>
        </CardContent>
      </Card>
    </div>
  )
}
