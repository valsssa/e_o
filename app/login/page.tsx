import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import AuthForm from "@/components/auth-form"

export default async function Login() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-black/30 backdrop-blur-md p-8 rounded-xl border border-purple-500/20 shadow-lg shadow-purple-500/10 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
            Esoteric Oracle
          </h1>
          <p className="mt-2 text-white/70">Sign in to access cosmic wisdom</p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}
