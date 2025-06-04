import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PersonaliaUmumPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Arsip Personalia & Umum</h1>

      <Card>
        <CardHeader>
          <CardTitle>Arsip Personalia & Umum</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            Halaman ini akan menampilkan arsip personalia & umum.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
