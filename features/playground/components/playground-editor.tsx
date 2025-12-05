"use client"

import { useRef, useEffect } from "react"
import Editor, { type Monaco } from "@monaco-editor/react"
import { configureMonaco, defaultEditorOptions, getEditorLanguage } from "@/features/playground/libs/editor-config"
import type { TemplateFile } from "@/features/playground/libs/path-to-json"

interface PlaygroundEditorProps {
  activeFile: TemplateFile | undefined
  content: string
  onContentChange: (value: string) => void
  fileId?: string | null
  selfId?: string | null
  broadcastFileOp?: (payload: any) => void
  onRemoteFileOp?: (handler: (payload: any) => void) => () => void
}

export const PlaygroundEditor = ({
  activeFile,
  content,
  onContentChange,
  fileId,
  selfId,
  broadcastFileOp,
  onRemoteFileOp,
}: PlaygroundEditorProps) => {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const remoteDecosRef = useRef<Map<string, string[]>>(new Map())
  const disposeRemoteRef = useRef<null | (() => void)>(null)

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    // Safety check to ensure editor and monaco are properly initialized
    if (!editor || !monaco) {
      console.warn("Editor or Monaco not properly initialized")
      return
    }

    editorRef.current = editor
    monacoRef.current = monaco
    console.log("Editor instance mounted:", !!editorRef.current)

    if (editor && typeof editor.updateOptions === 'function') {
      editor.updateOptions({
        ...defaultEditorOptions,
        // Enable inline suggestions but with specific settings to prevent conflicts
        inlineSuggest: {
          enabled: true,
          mode: "prefix",
          suppressSuggestions: false,
        },
        // Disable some conflicting suggest features
        suggest: {
          preview: false, // Disable preview to avoid conflicts
          showInlineDetails: false,
          insertMode: "replace",
        },
        // Quick suggestions
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false,
        },
        // Smooth cursor
        cursorSmoothCaretAnimation: "on",
      })
    }

    if (typeof configureMonaco === 'function') {
      configureMonaco(monaco)
    }
  }

  const updateEditorLanguage = () => {
    if (!activeFile || !monacoRef.current || !editorRef.current) return
    const model = editorRef.current.getModel()
    if (!model) return

    const language = getEditorLanguage(activeFile.fileExtension || "")
    try {
      monacoRef.current.editor.setModelLanguage(model, language)
    } catch (error) {
      console.warn("Failed to set editor language:", error)
    }
  }

  useEffect(() => {
    updateEditorLanguage()
  }, [activeFile])

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return
    if (!fileId || !selfId || !broadcastFileOp) return
    const editor = editorRef.current
    const model = editor.getModel()
    if (!model) return
    let lastSent = 0
    const send = () => {
      try {
        const now = Date.now()
        if (now - lastSent < 200) return

        const sels = editor.getSelections?.() || []
        const list = Array.isArray(sels) && sels.length
          ? sels
          : (editor.getSelection() ? [editor.getSelection()] : [])
        if (!list.length) return

        const cursors = list.map((s: any) => {
          const start = model.getOffsetAt(s.getStartPosition())
          const end = model.getOffsetAt(s.getEndPosition())
          return { start, end }
        })

        broadcastFileOp({ type: "cursor", fileId, socketId: selfId, cursors })
        lastSent = now
      } catch { }
    }
    // initial presence
    send()
    const subSel = editor.onDidChangeCursorSelection(() => send())
    const subPos = editor.onDidChangeCursorPosition(() => send())
    return () => {
      try { subSel.dispose() } catch { }
      try { subPos.dispose() } catch { }
    }
  }, [fileId, selfId, broadcastFileOp])

  useEffect(() => {
    if (!onRemoteFileOp) return
    if (!editorRef.current || !monacoRef.current) return
    const editor = editorRef.current
    const monaco = monacoRef.current
    const model = editor.getModel()
    if (!model) return
    if (disposeRemoteRef.current) { try { disposeRemoteRef.current() } catch { } disposeRemoteRef.current = null }
    const dispose = onRemoteFileOp((payload) => {
      try {
        if (!payload || payload.type !== "cursor") return
        if (!fileId || payload.fileId !== fileId) return
        if (payload.socketId && selfId && payload.socketId === selfId) return
        const docLen = model.getValueLength()
        const startOff = Math.max(0, Math.min(payload.start ?? 0, docLen))
        const endOffRaw = (payload.end == null ? startOff : payload.end)
        let endOff = Math.max(0, Math.min(endOffRaw, docLen))
        const isCaret = startOff === endOff
        let range
        if (isCaret) {
          const pos = model.getPositionAt(startOff)
          range = new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column)
        } else {
          const startPos = model.getPositionAt(startOff)
          const endPos = model.getPositionAt(endOff)
          range = new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column)
        }

        const key = String(payload.socketId || "peer")
        const prev = remoteDecosRef.current.get(key) || []
        const opts = isCaret
          ? {
            afterContentClassName: "remote-caret",
            isWholeLine: false,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            overviewRuler: { color: "#22c55e", position: monaco.editor.OverviewRulerLane.Full },
          }
          : {
            inlineClassName: "remote-selection",
            isWholeLine: false,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            overviewRuler: { color: "#22c55e", position: monaco.editor.OverviewRulerLane.Full },
          }

        const ids = editor.deltaDecorations(prev, [{ range, options: opts }])
        remoteDecosRef.current.set(key, ids)
      } catch { }
    })
    disposeRemoteRef.current = dispose
    return () => {
      try { dispose() } catch { }
      disposeRemoteRef.current = null
      try {
        const all = Array.from(remoteDecosRef.current.values()).flat()
        if (all.length) editor.deltaDecorations(all, [])
        remoteDecosRef.current.clear()
      } catch { }
    }
  }, [onRemoteFileOp, fileId, selfId])

  return (
    <div className="h-full relative">
      <Editor
        height="100%"
        value={content}
        onChange={(value) => onContentChange(value || "")}
        onMount={handleEditorDidMount}
        language={activeFile ? getEditorLanguage(activeFile.fileExtension || "") : "plaintext"}
        options={defaultEditorOptions}
      />
    </div>
  )
}