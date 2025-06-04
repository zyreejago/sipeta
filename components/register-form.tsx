"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Lock, Mail, User } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: "Registrasi berhasil",
        description: "Akun Anda telah dibuat. Silahkan login.",
      })

      // Redirect to login page
      router.push("/")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registrasi gagal",
        description: error.message || "Terjadi kesalahan saat registrasi",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center bg-gradient-to-br from-green-600 to-green-500 text-white">
        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="flex items-center justify-center gap-4">
            <div className="relative w-32 h-16">
              <Image
                src="/images/logo-perkebunan-nusantara.png"
                alt="Logo Perkebunan Nusantara"
                fill
                className="object-contain"
              />
            </div>
            <div className="relative w-16 h-16">
              <Image src="/images/logo-ptpn4.png" alt="Logo PTPN 4" fill className="object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Daftar Akun SIPETA</CardTitle>
        </div>
        <p className="text-green-100 mt-1">Buat akun baru untuk mengakses sistem</p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                placeholder="Masukkan email"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                placeholder="Masukkan password"
                required
                minLength={6}
              />
            </div>
            <p className="text-xs text-muted-foreground">Password minimal 6 karakter</p>
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Memproses..." : "Daftar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
