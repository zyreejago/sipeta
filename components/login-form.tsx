"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, Mail, User } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export function LoginForm() {
  const [emailOrNik, setEmailOrNik] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let loginResult
      
      // Check if input is email (contains @) or NIK
      const isEmail = emailOrNik.includes('@')
      
      if (isEmail) {
        // Login with email
        loginResult = await supabase.auth.signInWithPassword({
          email: emailOrNik,
          password,
        })
      } else {
        // Login with NIK - first find the user's email from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('nik', emailOrNik)
          .single()
        
        if (profileError || !profile) {
          throw new Error('NIK tidak ditemukan')
        }
        
        // Login with the found email
        loginResult = await supabase.auth.signInWithPassword({
          email: profile.email,
          password,
        })
      }

      if (loginResult.error) {
        throw loginResult.error
      }

      toast({
        title: "Login sukses",
        description: "Anda berhasil masuk ke sistem",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login gagal",
        description: error.message || "Terjadi kesalahan saat login",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl grid md:grid-cols-2 overflow-hidden shadow-xl">
      <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-600 to-green-500 text-white">
        <div className="text-center mb-6">
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
            <h1 className="text-3xl font-bold mb-2">SIPETA</h1>
          </div>
          <p className="text-green-100">Sistem Pengarsipan Digital</p>
        </div>
        <div className="relative w-full h-64 mb-4">
          <Image
            src="/images/document-archive-illustration.png"
            alt="Document Archive Illustration"
            fill
            className="object-contain"
          />
        </div>
        <div className="text-center mt-4">
          <p className="text-sm text-green-100">
            Sistem pengarsipan digital untuk manajemen dokumen yang efisien dan terorganisir
          </p>
        </div>
      </div>
      <CardContent className="p-6 flex flex-col justify-center space-y-6 bg-white">
        <CardHeader className="p-0 pb-4 text-center">
          <h2 className="text-2xl font-semibold">Login</h2>
          <p className="text-sm text-muted-foreground mt-1">Masukkan kredensial Anda untuk mengakses sistem</p>
        </CardHeader>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailOrNik" className="text-sm font-medium">
              Email atau NIK
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="emailOrNik"
                type="text"
                placeholder="Email atau NIK anda"
                value={emailOrNik}
                onChange={(e) => setEmailOrNik(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link href="#" className="text-sm text-green-600 hover:text-green-700">
                Lupa password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
            {loading ? "Memproses..." : "Sign In"}
          </Button>
          <div className="mt-4 text-center">
            <Link href="/register" className="text-sm text-green-600 hover:text-green-700">
              Belum punya akun? Daftar disini
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}