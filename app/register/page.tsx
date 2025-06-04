import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { RegisterForm } from "@/components/register-form"
import { Button } from "@/components/ui/button"

export default async function RegisterPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()

  if (data.session) {
    redirect("/dashboard")
  }

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-cover bg-center p-4 w-full"
      style={{ backgroundImage: "url('/images/palm-oil-plantation-hd.png')" }}
    >
      <div className="container mx-auto px-4 flex flex-col items-center justify-center">
        <RegisterForm />
        <div className="mt-4">
          <Button variant="link" asChild>
            <Link href="/" className="text-white">
              Sudah punya akun? Login
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
