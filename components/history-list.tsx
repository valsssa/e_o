"use client"

import { useState } from "react"
import { HistoryItem } from "@/components/history-item"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Star } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSupabase } from "@/components/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { deleteOracleInteraction } from "@/lib/db-utils"
import type { OracleInteraction } from "@/lib/db-utils"

interface HistoryListProps {
  initialInteractions: OracleInteraction[]
}

export function HistoryList({ initialInteractions }: HistoryListProps) {
  const [interactions, setInteractions] = useState<OracleInteraction[]>(initialInteractions)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const filteredInteractions = interactions.filter((interaction) => {
    const matchesSearch = interaction.question.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === "all" || (activeTab === "favorites" && interaction.is_favorite)
    return matchesSearch && matchesTab
  })

  const handleDelete = async (id: string) => {
    if (!supabase) return

    try {
      setIsLoading(true)

      const { success, error } = await deleteOracleInteraction(supabase, id)

      if (!success) throw error

      setInteractions(interactions.filter((interaction) => interaction.id !== id))

      toast({
        title: "Interaction deleted",
        description: "The oracle interaction has been removed from your history",
      })
    } catch (error: any) {
      console.error("[HistoryList] Error deleting interaction:", error)

      toast({
        title: "Error deleting interaction",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    if (!supabase) return

    try {
      // Update local state immediately for responsive UI
      setInteractions(
        interactions.map((interaction) =>
          interaction.id === id ? { ...interaction, is_favorite: isFavorite } : interaction,
        ),
      )

      // Update in database
      const { error } = await supabase.from("oracle_interactions").update({ is_favorite: isFavorite }).eq("id", id)

      if (error) {
        console.error("[HistoryList] Error updating favorite status:", error)
        throw error
      }

      toast({
        title: isFavorite ? "Added to favorites" : "Removed from favorites",
        description: isFavorite
          ? "This oracle response has been added to your favorites"
          : "This oracle response has been removed from your favorites",
      })
    } catch (error: any) {
      console.error("[HistoryList] Error toggling favorite:", error)

      // Revert local state on error
      setInteractions(
        interactions.map((interaction) =>
          interaction.id === id ? { ...interaction, is_favorite: !isFavorite } : interaction,
        ),
      )

      toast({
        title: "Error updating favorite status",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search your questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/30 border-purple-900/50 focus:border-purple-500"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="bg-black/30 border border-purple-900/50">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Favorites
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredInteractions.length > 0 ? (
        <div className="space-y-4">
          {filteredInteractions.map((interaction) => (
            <HistoryItem
              key={interaction.id}
              id={interaction.id}
              question={interaction.question}
              response={interaction.response}
              createdAt={interaction.created_at}
              isFavorite={interaction.is_favorite}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              isLoading={isLoading}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {searchQuery
              ? "No matching oracle consultations found"
              : activeTab === "favorites"
                ? "You haven't favorited any oracle consultations yet"
                : "You haven't consulted the oracle yet"}
          </p>
          {searchQuery && (
            <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2 text-purple-400">
              Clear search
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
