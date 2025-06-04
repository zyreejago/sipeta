import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TanamanPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Arsip Tanaman</h1>

      <Card>
        <CardHeader>
          <CardTitle>Arsip Tanaman</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">Halaman ini akan menampilkan arsip tanaman.</p>
        </CardContent>
      </Card>
    </div>
  )
}
