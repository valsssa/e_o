import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import OracleConsultation from "@/components/oracle-consultation"

export default async function Home() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-24">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mb-4">
          Esoteric Oracle
        </h1>
        <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
          Seek wisdom from the cosmic forces. Ask your question and receive guidance from the mystical oracle.
        </p>
      </div>

      <div className="w-full max-w-3xl">
        <OracleConsultation user={session.user} />
      </div>
    </div>
  )
}
