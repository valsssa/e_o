import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StarsBackground } from "@/components/stars-background"
import { NavBar } from "@/components/nav-bar"
import { HistoryList } from "@/components/history-list"

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error("[Profile Page] Session error:", sessionError)
  }

  if (!session) {
    redirect("/")
  }

  // Fetch user's oracle interactions
  const { data: interactions, error: interactionsError } = await supabase
    .from("oracle_interactions")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (interactionsError) {
    console.error("[Profile Page] Error fetching interactions:", interactionsError)
  }

  return (
    <main className="min-h-screen cosmic-gradient relative">
      <StarsBackground />
      <NavBar />

      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Your Oracle Journey
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Review your past consultations with the cosmic oracle
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <HistoryList initialInteractions={interactions || []} />
        </div>
      </div>
    </main>
  )
}
