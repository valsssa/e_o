import type { SupabaseClient } from "@supabase/supabase-js"

// Type for oracle interactions
export interface OracleInteraction {
  id: string
  user_id: string
  question: string
  response: string
  created_at: string
  is_favorite?: boolean
}

// Function to save an oracle interaction
export async function saveOracleInteraction(
  supabase: SupabaseClient,
  userId: string,
  question: string,
  response: string,
): Promise<{ data: OracleInteraction | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("oracle_interactions")
      .insert({
        user_id: userId,
        question,
        response,
      })
      .select()
      .single()

    if (error) {
      console.error("[DB Utils] Error saving oracle interaction:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("[DB Utils] Unexpected error saving oracle interaction:", error)
    return { data: null, error: error as Error }
  }
}

// Function to get oracle interactions for a user
export async function getUserOracleInteractions(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: OracleInteraction[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("oracle_interactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[DB Utils] Error getting user oracle interactions:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("[DB Utils] Unexpected error getting user oracle interactions:", error)
    return { data: null, error: error as Error }
  }
}

// Function to update an oracle interaction's favorite status
export async function updateOracleInteractionFavorite(
  supabase: SupabaseClient,
  interactionId: string,
  isFavorite: boolean,
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from("oracle_interactions")
      .update({ is_favorite: isFavorite })
      .eq("id", interactionId)

    if (error) {
      console.error("[DB Utils] Error updating oracle interaction favorite status:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("[DB Utils] Unexpected error updating oracle interaction favorite status:", error)
    return { success: false, error: error as Error }
  }
}

// Function to delete an oracle interaction
export async function deleteOracleInteraction(
  supabase: SupabaseClient,
  interactionId: string,
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.from("oracle_interactions").delete().eq("id", interactionId)

    if (error) {
      console.error("[DB Utils] Error deleting oracle interaction:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("[DB Utils] Unexpected error deleting oracle interaction:", error)
    return { success: false, error: error as Error }
  }
}
