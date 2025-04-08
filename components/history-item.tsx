"use client"

import { useState } from "react"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Star, StarOff, Trash2, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface HistoryItemProps {
  id: string
  question: string
  response: string
  createdAt: string
  isFavorite?: boolean
  isLoading?: boolean
  onDelete: (id: string) => void
  onToggleFavorite: (id: string, isFavorite: boolean) => void
}

export function HistoryItem({
  id,
  question,
  response,
  createdAt,
  isFavorite = false,
  isLoading = false,
  onDelete,
  onToggleFavorite,
}: HistoryItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleFavorite = () => {
    onToggleFavorite(id, !isFavorite)
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    await onDelete(id)
    setIsDeleting(false)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <Card className="bg-black/40 backdrop-blur-md border-purple-900/50 hover:glow transition-all">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="font-medium">{question}</p>
              <p className="text-sm text-gray-400">{formatDate(createdAt)}</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                disabled={isLoading}
                className={`text-gray-300 hover:text-yellow-400 ${isFavorite ? "text-yellow-400" : ""}`}
              >
                {isFavorite ? <Star className="h-4 w-4 fill-yellow-400" /> : <StarOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
                className="text-gray-300 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 p-4 bg-black/30 rounded-md">
              <h4 className="text-sm font-medium text-purple-300 mb-2">Oracle's Response:</h4>
              <div className="text-sm whitespace-pre-line">{response}</div>
            </div>
          )}
        </CardContent>
        <CardFooter className="px-4 py-2 flex justify-center border-t border-purple-900/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-gray-300 hover:text-purple-400 w-full"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Response
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                View Response
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-black/80 border-purple-900/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this oracle interaction from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-purple-900/50 text-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
