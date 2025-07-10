
import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()

  if (!data.session) {
    redirect("/")
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col w-full">
          <header className="h-16 border-b flex items-center px-4 bg-white shadow-sm">
            <SidebarTrigger className="mr-2 md:hidden" />
            <h1 className="text-xl font-semibold truncate">SIPETA - Sistem Pengarsipan Digital</h1>
          </header>
          <main className="flex-1 overflow-auto p-6 bg-gray-50 w-full">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
