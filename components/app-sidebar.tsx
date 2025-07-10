"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Archive,
  BookOpen,
  FileSpreadsheet,
  FileText,
  FileUp,
  Home,
  Leaf,
  LogOut,
  Mail,
  MessageSquare,
  Settings,
  Truck,
  Users,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from "@/components/ui/sidebar"

const fileUploadItems = [
  { name: "Arsip Surat Masuk", path: "/dashboard/surat-masuk", icon: Mail },
  { name: "Arsip Surat Keluar", path: "/dashboard/surat-keluar", icon: FileText },
  { name: "Arsip Surat Intern", path: "/dashboard/surat-intern", icon: MessageSquare },
  { name: "Arsip Tata Usaha & Keuangan", path: "/dashboard/tata-usaha-keuangan", icon: FileSpreadsheet },
  { name: "Arsip Personalia & Umum", path: "/dashboard/personalia-umum", icon: Users },
  { name: "Arsip Tanaman", path: "/dashboard/tanaman", icon: Leaf },
  { name: "Arsip Teknik & Transport", path: "/dashboard/teknik-transport", icon: Truck },
]

export function AppSidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const { isMobile, setOpenMobile } = useSidebar()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  // Tutup sidebar mobile saat item menu diklik
  const handleMenuItemClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar className="border-r shadow-sm">
      <SidebarHeader className="h-auto flex flex-col items-center px-4 py-3 border-b bg-gradient-to-r from-green-600 to-green-500">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="relative w-24 h-12">
            <Image
              src="/images/logo-perkebunan-nusantara.png"
              alt="Logo Perkebunan Nusantara"
              fill
              className="object-contain"
            />
          </div>
          <div className="relative w-12 h-12">
            <Image src="/images/logo-ptpn4.png" alt="Logo PTPN 4" fill className="object-contain" />
          </div>
        </div>
        <Link href="/dashboard" className="flex items-center gap-2" onClick={handleMenuItemClick}>
          <Archive className="h-6 w-6 text-white" />
          <span className="font-bold text-xl text-white">SIPETA</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/dashboard"} onClick={handleMenuItemClick}>
              <Link href="/dashboard">
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/dashboard/users"} onClick={handleMenuItemClick}>
              <Link href="/dashboard/users">
                <Users className="h-5 w-5" />
                <span>User</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Collapsible defaultOpen={pathname.includes("/dashboard/surat")}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <FileUp className="h-5 w-5" />
                  <span>File Upload</span>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {fileUploadItems.map((item) => (
                    <SidebarMenuSubItem key={item.path}>
                      <SidebarMenuSubButton asChild isActive={pathname === item.path} onClick={handleMenuItemClick}>
                        <Link href={item.path} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/dashboard/tutorial"} onClick={handleMenuItemClick}>
              <Link href="/dashboard/tutorial">
                <BookOpen className="h-5 w-5" />
                <span>Tutorial Penggunaan</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/dashboard/settings"} onClick={handleMenuItemClick}>
              <Link href="/dashboard/settings">
                <Settings className="h-5 w-5" />
                <span>Pengaturan</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
