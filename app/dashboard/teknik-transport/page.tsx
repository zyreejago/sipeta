import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TeknikTransportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Arsip Teknik & Transport</h1>

      <Card>
        <CardHeader>
          <CardTitle>Arsip Teknik & Transport</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            Halaman ini akan menampilkan arsip teknik & transport.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
