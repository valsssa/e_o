import type { SupabaseClient } from "@supabase/supabase-js"
import { handleError } from "./error-utils"

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
      const { error: handledError } = handleError(
        error, 
        "DB Utils: saveOracleInteraction",
        "Error saving oracle interaction"
      )
      return { data: null, error: handledError }
    }

    return { data, error: null }
  } catch (error) {
    const { error: handledError } = handleError(
      error, 
      "DB Utils: saveOracleInteraction",
      "Unexpected error saving oracle interaction"
    )
    return { data: null, error: handledError }
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
      const { error: handledError } = handleError(
        error, 
        "DB Utils: getUserOracleInteractions",
        "Error fetching oracle interactions"
      )
      return { data: null, error: handledError }
    }

    return { data, error: null }
  } catch (error) {
    const { error: handledError } = handleError(
      error, 
      "DB Utils: getUserOracleInteractions",
      "Unexpected error fetching oracle interactions"
    )
    return { data: null, error: handledError }
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
      const { error: handledError } = handleError(
        error, 
        "DB Utils: updateOracleInteractionFavorite",
        "Error updating favorite status"
      )
      return { success: false, error: handledError }
    }

    return { success: true, error: null }
  } catch (error) {
    const { error: handledError } = handleError(
      error, 
      "DB Utils: updateOracleInteractionFavorite",
      "Unexpected error updating favorite status"
    )
    return { success: false, error: handledError }
  }
}

// Function to delete an oracle interaction
export async function deleteOracleInteraction(
  supabase: SupabaseClient,
  interactionId: string,
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from("oracle_interactions")
      .delete()
      .eq("id", interactionId)

    if (error) {
      const { error: handledError } = handleError(
        error, 
        "DB Utils: deleteOracleInteraction",
        "Error deleting oracle interaction"
      )
      return { success: false, error: handledError }
    }

    return { success: true, error: null }
  } catch (error) {
    const { error: handledError } = handleError(
      error, 
      "DB Utils: deleteOracleInteraction",
      "Unexpected error deleting oracle interaction"
    )
    return { success: false, error: handledError }
  }
}