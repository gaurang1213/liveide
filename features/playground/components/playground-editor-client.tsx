"use client";
import React from 'react'
import { PlaygroundEditor } from './playground-editor'
import type { TemplateFile } from "@/features/playground/libs/path-to-json"

interface PlaygroundEditorClientProps {
  activeFile?: TemplateFile
  content: string
  onContentChange: (value: string) => void
}

const PlaygroundEditorClient: React.FC<PlaygroundEditorClientProps> = ({ activeFile, content, onContentChange }) => {
  return (
    <div className="h-screen">
      <PlaygroundEditor 
        activeFile={activeFile}
        content={content}
        onContentChange={onContentChange}
      />
    </div>
  )
}

export default PlaygroundEditorClient