import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { LoginForm } from "@/components/login-form"

export default async function Home() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getSession()

    if (data.session) {
      redirect("/dashboard")
    }
  } catch (error) {
    console.error("Error checking session:", error)
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-cover bg-center p-4 w-full"
      style={{ backgroundImage: "url('/images/palm-oil-plantation-hd.png')" }}
    >
      <div className="container mx-auto px-4 flex justify-center">
        <LoginForm />
      </div>
    </main>
  )
}
