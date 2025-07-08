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
  const [nik, setNik] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    console.log('🚀 Starting registration process...')
    console.log('Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
    })
    
    console.log('Registration data:', {
      email: email.trim(),
      passwordLength: password.length,
      fullName: fullName.trim(),
      nik: nik.trim()
    })

    try {
      // Validasi input
      const trimmedEmail = email.trim().toLowerCase()
      const trimmedFullName = fullName.trim()
      const trimmedNik = nik.trim()
      const trimmedPassword = password.trim()

      if (!trimmedEmail || !trimmedPassword || !trimmedFullName || !trimmedNik) {
        throw new Error("Semua field harus diisi")
      }

      if (trimmedPassword.length < 6) {
        throw new Error("Password minimal 6 karakter")
      }

      // Validasi NIK (10-16 digit)
      if (!/^\d{10,16}$/.test(trimmedNik)) {
        throw new Error("NIK harus berupa 10-16 digit angka")
      }

      // Validasi format email yang sangat permisif
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        throw new Error("Format email tidak valid")
      }

      // Cek environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Konfigurasi Supabase tidak lengkap. Pastikan environment variables sudah diset.")
      }

      // Skip NIK check untuk sementara jika tabel belum ada
      console.log('🔍 Checking if NIK already exists...')
      try {
        const { data: existingProfile, error: nikCheckError } = await supabase
          .from('profiles')
          .select('nik')
          .eq('nik', trimmedNik)
          .maybeSingle()

        if (nikCheckError) {
          console.warn('⚠️ Warning checking NIK (table might not exist):', nikCheckError)
        } else if (existingProfile) {
          throw new Error("NIK sudah terdaftar")
        }
        console.log('✅ NIK check completed')
      } catch (nikError) {
        console.warn('⚠️ NIK check failed, continuing registration:', nikError)
      }

      console.log('🔐 Attempting Supabase auth signup...')
      
      // Coba dengan email yang dinormalisasi
      const normalizedEmail = trimmedEmail.replace(/\s+/g, '').toLowerCase()
      
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: trimmedPassword,
        options: {
          data: {
            full_name: trimmedFullName,
            nik: trimmedNik,
          },
        },
      })

      console.log('📊 Supabase signup response:', { 
        user: data.user ? 'User created' : 'No user', 
        session: data.session ? 'Session created' : 'No session',
        error: error ? error.message : 'No error'
      })

      if (error) {
        console.error('❌ Supabase signup error:', error)
        
        // Handle specific errors
        if (error.message.includes('API key') || error.message.includes('apikey')) {
          throw new Error("Masalah konfigurasi sistem. Pastikan file .env.local sudah dibuat dengan benar dan restart server.")
        } else if (error.message.includes('User already registered') || 
                   error.message.includes('already been registered')) {
          throw new Error("Email sudah terdaftar")
        } else if (error.message.includes('Password should be at least')) {
          throw new Error("Password terlalu lemah. Gunakan minimal 6 karakter")
        } else if (error.message.includes('Invalid email') || 
                   error.message.includes('invalid')) {
          // Coba dengan format email yang berbeda
          console.log('🔄 Trying alternative email format...')
          const altEmail = trimmedEmail.replace(/[^a-zA-Z0-9@.-]/g, '')
          
          const { data: retryData, error: retryError } = await supabase.auth.signUp({
            email: altEmail,
            password: trimmedPassword,
            options: {
              data: {
                full_name: trimmedFullName,
                nik: trimmedNik,
              },
            },
          })
          
          if (retryError) {
            throw new Error(`Format email tidak diterima oleh sistem: ${retryError.message}`)
          }
          
          // Gunakan hasil retry
          Object.assign(data, retryData)
        } else if (error.message.includes('Signup is disabled')) {
          throw new Error("Registrasi sedang dinonaktifkan. Silakan hubungi administrator")
        } else {
          throw new Error(`Registrasi gagal: ${error.message}`)
        }
      }

      
      // Jika signup berhasil, buat profile
      if (data.user && data.user.id) {
        console.log('👤 User created successfully, creating profile...')
        
        try {
          const profileData = {
            id: data.user.id,
            full_name: trimmedFullName,
            nik: trimmedNik,
            email: normalizedEmail,
            // role: 'user'
          }
          
          console.log('📝 Inserting profile data:', profileData)
          console.log('🔍 NIK value being saved:', trimmedNik)
    console.log('🔍 NIK type:', typeof trimmedNik)
          const { data: profileResult, error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData, {
              onConflict: 'id'
            })
            .select()
          
          if (profileError) {
            console.error('❌ Error creating profile:', profileError)
            
            if (profileError.message.includes('relation "profiles" does not exist')) {
              console.warn('⚠️ Table profiles does not exist, but user is registered in auth')
              toast({
                title: "Registrasi berhasil",
                description: "Akun berhasil dibuat. Tabel profil akan dibuat otomatis saat login pertama.",
              })
            } else {
              toast({
                variant: "destructive",
                title: "Profil tidak tersimpan",
                description: `User berhasil dibuat tapi profil gagal disimpan: ${profileError.message}`,
              })
            }
          } else {
            console.log('✅ Profile created successfully:', profileResult)
            toast({
              title: "Registrasi berhasil",
              description: "Akun dan profil berhasil dibuat. Silahkan login.",
            })
          }
        } catch (profileError) {
          console.error('💥 Profile creation failed:', profileError)
          toast({
            title: "Registrasi berhasil",
            description: "Akun berhasil dibuat. Profil akan dibuat saat login pertama.",
          })
        }
      } else {
        console.error('❌ No user created in signup response')
        throw new Error("Gagal membuat user")
      }

      console.log('🎉 Registration process completed!')
      
      // Reset form
      setEmail("")
      setPassword("")
      setFullName("")
      setNik("")

      // Redirect ke halaman login
      router.push("/")
      
    } catch (error: any) {
      console.error('💥 Registration error:', error)
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
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nik">NIK (10-16 digit)</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="nik"
                value={nik}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 16)
                  setNik(value)
                }}
                className="pl-10"
                placeholder="Masukkan NIK (10-16 digit)"
                required
                disabled={loading}
                maxLength={16}
                minLength={10}
              />
            </div>
            <p className="text-xs text-muted-foreground">NIK harus berupa 10-16 digit angka</p>
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
                placeholder="contoh: nama@domain.com"
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">Gunakan format email yang valid</p>
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
                disabled={loading}
                minLength={6}
              />
            </div>
            <p className="text-xs text-muted-foreground">Password minimal 6 karakter</p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700" 
            disabled={loading}
          >
            {loading ? "Memproses..." : "Daftar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}