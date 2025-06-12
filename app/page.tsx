"use client"

import type React from "react"

import { useChat } from "ai/react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, Copy, RotateCcw, ArrowDown } from "lucide-react"
import { MermaidRenderer } from "@/components/mermaid-renderer"

export default function ClaudeChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, reload } = useChat({
    maxToolRoundtrips: 5,
  })

  const [charCount, setCharCount] = useState(0)
  const [tokenCount, setTokenCount] = useState(0)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setCharCount(input.length)
    // Rough token estimation (1 token ≈ 4 characters)
    setTokenCount(Math.ceil(input.length / 4))
  }, [input])

  // Handle scroll detection to show/hide scroll to bottom button
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setShowScrollToBottom(!isAtBottom)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      handleSubmit(e)
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e)
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"
  }

  const getResponseStats = (content: string) => {
    const charCount = content.length
    const tokenCount = Math.ceil(charCount / 4)
    const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length
    return { charCount, tokenCount, wordCount }
  }

  const parseMermaidFromText = (text: string) => {
    const mermaidRegex = /```mermaid(?:\s+title="([^"]*)")?(?:\s+type="([^"]*)")?\s*\n([\s\S]*?)\n```/g
    const parts: Array<{ type: "text" | "mermaid"; content: string; title?: string; diagramType?: string }> = []
    let lastIndex = 0
    let match

    while ((match = mermaidRegex.exec(text)) !== null) {
      // Add text before mermaid
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        })
      }

      // Add mermaid diagram
      parts.push({
        type: "mermaid",
        content: match[3].trim(),
        title: match[1],
        diagramType: match[2],
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: "text" as const,
        content: text.slice(lastIndex),
      })
    }

    return parts.length > 1 ? parts : [{ type: "text" as const, content: text }]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="h-[90vh] flex flex-col">
          <CardHeader className="border-b bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">Claude 4 Sonnet Chat Interface</CardTitle>
                <p className="text-slate-600 mt-1">Advanced AI conversation with extended reasoning capabilities</p>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                claude-4-sonnet-20250514
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 relative">
            <ScrollArea className="flex-1 p-6" onScrollCapture={handleScroll} ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-slate-400 text-lg mb-4">Your Software Architect</div>
                    <div className="text-sm text-slate-500 max-w-2xl mx-auto">
                     
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div key={message.id} className="space-y-4">
                    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] ${
                          message.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-slate-200"
                        } rounded-2xl p-4 shadow-sm`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant={message.role === "user" ? "secondary" : "outline"}
                            className={message.role === "user" ? "bg-blue-500" : ""}
                          >
                            {message.role === "user" ? "You" : "Claude 4 Sonnet"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(message.content)}
                            className={`h-6 w-6 p-0 ${
                              message.role === "user" ? "text-blue-200 hover:text-white" : "text-slate-400"
                            }`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>

                        {message.parts?.map((part, index) => {
                          if (part.type === "text") {
                            const stats = getResponseStats(part.text)
                            const parsedContent = parseMermaidFromText(part.text)

                            return (
                              <div key={index}>
                                <div className="space-y-4">
                                  {parsedContent.map((contentPart, partIndex) => (
                                    <div key={partIndex}>
                                      {contentPart.type === "text" ? (
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                          {contentPart.content}
                                        </div>
                                      ) : (
                                        <div className="my-4">
                                          <MermaidRenderer
                                            chart={contentPart.content}
                                            title={contentPart.title}
                                            diagramType={contentPart.diagramType}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {message.role === "assistant" && (
                                  <div className="mt-3 pt-3 border-t border-slate-200 flex gap-4 text-xs text-slate-500">
                                    <span>{stats.charCount.toLocaleString()} characters</span>
                                    <span>{stats.tokenCount.toLocaleString()} tokens (est.)</span>
                                    <span>{stats.wordCount.toLocaleString()} words</span>
                                  </div>
                                )}
                              </div>
                            )
                          }

                          if (part.type === "reasoning") {
                            return (
                              <details key={index} className="mt-3 p-3 bg-slate-50 rounded-lg">
                                <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                                  🧠 View Reasoning Process
                                </summary>
                                <pre className="mt-2 text-xs text-slate-600 whitespace-pre-wrap overflow-x-auto">
                                  {part.details
                                    .map((detail, detailIndex) => (detail.type === "text" ? detail.text : "<redacted>"))
                                    .join("")}
                                </pre>
                              </details>
                            )
                          }
                        })}

                        {!message.parts && (
                          <div>
                            <div className="space-y-4">
                              {parseMermaidFromText(message.content).map((contentPart, partIndex) => (
                                <div key={partIndex}>
                                  {contentPart.type === "text" ? (
                                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                      {contentPart.content}
                                    </div>
                                  ) : (
                                    <div className="my-4">
                                      <MermaidRenderer
                                        chart={contentPart.content}
                                        title={contentPart.title}
                                        diagramType={contentPart.diagramType}
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            {message.role === "assistant" && (
                              <div className="mt-3 pt-3 border-t border-slate-200 flex gap-4 text-xs text-slate-500">
                                <span>{message.content.length.toLocaleString()} characters</span>
                                <span>{Math.ceil(message.content.length / 4).toLocaleString()} tokens (est.)</span>
                                <span>{message.content.split(/\s+/).length.toLocaleString()} words</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Claude is thinking and generating response...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Scroll to bottom button - only shows when not at bottom */}
            {showScrollToBottom && (
              <Button
                onClick={scrollToBottom}
                className="absolute bottom-24 right-8 rounded-full h-12 w-12 p-0 shadow-lg bg-blue-600 hover:bg-blue-700 z-10"
                title="Scroll to bottom"
              >
                <ArrowDown className="h-5 w-5" />
              </Button>
            )}

            <div className="border-t bg-white/50 backdrop-blur-sm p-6">
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleTextareaChange}
                    placeholder="Hi"
                    className="min-h-[80px] max-h-[200px] resize-none pr-20 text-sm leading-relaxed"
                    disabled={isLoading}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {messages.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => reload()}
                        disabled={isLoading}
                        className="h-8 w-8 p-0"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button type="submit" disabled={isLoading || !input.trim()} className="h-8 w-8 p-0">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex gap-4">
                    <span>{charCount.toLocaleString()} characters</span>
                    <span>{tokenCount.toLocaleString()} tokens (estimated)</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      Max: 8,192 tokens output
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Reasoning enabled
                    </Badge>
                  </div>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
