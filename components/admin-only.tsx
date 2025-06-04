"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"

interface AdminOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AdminOnly({ children, fallback }: AdminOnlyProps) {
  const { isAdmin, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAdmin) {
    return fallback || null
  }

  return <>{children}</>
}
