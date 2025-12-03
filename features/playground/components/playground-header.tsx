"use client"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Save, Loader2, Sparkles, Settings, Plus, Lightbulb } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFileExplorer } from "../hooks/useFileExplorer"
import { useCollaboration } from "../hooks/useCollaboration"
import { toast } from "sonner"

export function PlaygroundHeader() {
  const {
    activeFileId,
    openFiles,
  } = useFileExplorer()

  const { connected, peerJoined } = useCollaboration({ playgroundId: "" })

  const selectedFile = activeFileId ? openFiles.find((f) => f.id === activeFileId) : null
  const hasUnsavedChanges = openFiles.some((f) => f.hasUnsavedChanges)
  const shareCode = ""

  return (
    <header className="h-14 border-b flex items-center px-4 justify-between">
      <div className="flex items-center">
        <SidebarTrigger className="mr-2" />
        <h1 className="text-lg font-semibold">Code Editor</h1>
        <div className="ml-4 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          {peerJoined && (
            <span className="text-xs text-blue-600">
              • Peer joined
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {selectedFile && (
          <span className="text-sm text-muted-foreground">
            {selectedFile.fileExtension ? `${selectedFile.filename}.${selectedFile.fileExtension}` : selectedFile.filename}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              console.log("Testing collaboration - broadcasting test message");
              // Test if collaboration is working
              if (window.confirm("Test collaboration? Check console for logs.")) {
                console.log("Collaboration test initiated");
              }
            }}>
              Test Collaboration
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}