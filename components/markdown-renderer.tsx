"use client"

import type React from "react"

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []
    let currentListItems: string[] = []
    let listType: "ordered" | "unordered" | null = null

    const flushList = () => {
      if (currentListItems.length > 0) {
        const ListComponent = listType === "ordered" ? "ol" : "ul"
        elements.push(
          <ListComponent
            key={elements.length}
            className={
              listType === "ordered"
                ? "list-decimal list-inside space-y-1 my-3"
                : "list-disc list-inside space-y-1 my-3"
            }
          >
            {currentListItems.map((item, index) => (
              <li key={index} className="text-sm leading-relaxed">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ListComponent>,
        )
        currentListItems = []
        listType = null
      }
    }

    const renderInlineMarkdown = (text: string) => {
      // Handle bold text **text**
      const parts = text.split(/(\*\*.*?\*\*)/g)
      return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return part
      })
    }

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()

      // Handle headings (##)
      if (trimmedLine.startsWith("##")) {
        flushList()
        const level = (trimmedLine.match(/^#+/) || [""])[0].length
        const text = trimmedLine.replace(/^#+\s*/, "")

        if (level === 2) {
          elements.push(
            <h2 key={elements.length} className="text-xl font-bold text-slate-800 mt-6 mb-3 first:mt-0">
              {renderInlineMarkdown(text)}
            </h2>,
          )
        } else if (level === 3) {
          elements.push(
            <h3 key={elements.length} className="text-lg font-semibold text-slate-700 mt-5 mb-2">
              {renderInlineMarkdown(text)}
            </h3>,
          )
        } else if (level >= 4) {
          elements.push(
            <h4 key={elements.length} className="text-base font-medium text-slate-600 mt-4 mb-2">
              {renderInlineMarkdown(text)}
            </h4>,
          )
        }
        return
      }

      // Handle unordered lists (- or *)
      if (trimmedLine.match(/^[-*]\s+/)) {
        const content = trimmedLine.replace(/^[-*]\s+/, "")
        if (listType !== "unordered") {
          flushList()
          listType = "unordered"
        }
        currentListItems.push(content)
        return
      }

      // Handle ordered lists (1. 2. etc.)
      if (trimmedLine.match(/^\d+\.\s+/)) {
        const content = trimmedLine.replace(/^\d+\.\s+/, "")
        if (listType !== "ordered") {
          flushList()
          listType = "ordered"
        }
        currentListItems.push(content)
        return
      }

      // Handle empty lines
      if (trimmedLine === "") {
        flushList()
        if (elements.length > 0) {
          elements.push(<div key={elements.length} className="h-3" />)
        }
        return
      }

      // Handle regular paragraphs
      flushList()
      if (trimmedLine) {
        elements.push(
          <p key={elements.length} className="text-sm leading-relaxed mb-3">
            {renderInlineMarkdown(trimmedLine)}
          </p>,
        )
      }
    })

    // Flush any remaining list items
    flushList()

    return elements
  }

  return <div className="space-y-0">{renderMarkdown(content)}</div>
}
