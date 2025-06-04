import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If user is not logged in and trying to access protected routes
    if (!session && pathname.startsWith("/dashboard")) {
      const redirectUrl = new URL("/", request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is logged in and trying to access login page
    if (session && pathname === "/") {
      const redirectUrl = new URL("/dashboard", request.url)
      return NextResponse.redirect(redirectUrl)
    }

    return NextResponse.next()
  } catch (error) {
    // If there's an error, allow the request to continue
    // The page's server component will handle authentication
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
