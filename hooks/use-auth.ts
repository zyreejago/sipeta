"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

type Profile = {
  id: string
  username: string
  full_name: string
  avatar_url: string
  role: string
}

export function useAuth() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

          setProfile(profile)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      fetchUser()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const isAdmin = profile?.role === "admin"

  return {
    user,
    profile,
    isAdmin,
    loading,
  }
}
