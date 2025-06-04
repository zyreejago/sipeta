import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, FileText, Mail, MessageSquare, Users, Leaf, Truck } from "lucide-react"

export default function Dashboard() {
  // Normally we would fetch this data from the database
  const stats = [
    { title: "Surat Masuk", value: 128, icon: Mail, color: "bg-blue-100 text-blue-700" },
    { title: "Surat Keluar", value: 87, icon: FileText, color: "bg-green-100 text-green-700" },
    { title: "Surat Intern", value: 54, icon: MessageSquare, color: "bg-purple-100 text-purple-700" },
    { title: "Tata Usaha & Keuangan", value: 42, icon: BarChart3, color: "bg-yellow-100 text-yellow-700" },
    { title: "Personalia & Umum", value: 36, icon: Users, color: "bg-pink-100 text-pink-700" },
    { title: "Tanaman", value: 29, icon: Leaf, color: "bg-emerald-100 text-emerald-700" },
    { title: "Teknik & Transport", value: 18, icon: Truck, color: "bg-orange-100 text-orange-700" },
  ]

  return (
    <div className="space-y-6 max-w-full">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
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
    </div>
  )
}
