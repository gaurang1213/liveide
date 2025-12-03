"use client"

import { PlaygroundEditor } from "./playground-editor"
import { PlaygroundHeader } from "./playground-header"
import { useFileExplorer } from "../hooks/useFileExplorer"

export function PlaygroundLayout() {
  const { activeFileId, openFiles, updateFileContent } = useFileExplorer()
  const activeFile = activeFileId ? openFiles.find(f => f.id === activeFileId) : undefined
  const content = activeFile?.content || ""

  return (
    <div className="h-screen flex flex-col">
      <PlaygroundHeader />
      <PlaygroundEditor 
        activeFile={activeFile}
        content={content}
        onContentChange={(val) => {
          if (activeFileId) updateFileContent(activeFileId, val)
        }}
      />
    </div>
  )
}