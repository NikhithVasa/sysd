"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Maximize2, ZoomIn, ZoomOut, Copy, Download } from "lucide-react"

interface MermaidRendererProps {
  chart: string
  title?: string
  diagramType?: string
}

export function MermaidRenderer({ chart, title, diagramType }: MermaidRendererProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)
  const modalMermaidRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [error, setError] = useState<string | null>(null)

  const renderMermaid = async (element: HTMLDivElement, id: string) => {
    try {
      // Dynamically import mermaid
      const mermaid = (await import("mermaid")).default

      mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      })

      element.innerHTML = ""
      const { svg } = await mermaid.render(id, chart)
      element.innerHTML = svg
      setError(null)
    } catch (err) {
      console.error("Mermaid rendering error:", err)
      setError("Failed to render diagram")
      element.innerHTML = `<div class="text-red-500 text-sm p-4 border border-red-200 rounded">
        <p>Failed to render Mermaid diagram</p>
        <pre class="mt-2 text-xs bg-red-50 p-2 rounded overflow-x-auto">${chart}</pre>
      </div>`
    }
  }

  useEffect(() => {
    if (mermaidRef.current && !isLoaded) {
      renderMermaid(mermaidRef.current, `mermaid-${Date.now()}-${Math.random()}`)
      setIsLoaded(true)
    }
  }, [chart, isLoaded])

  const handleModalOpen = () => {
    setTimeout(() => {
      if (modalMermaidRef.current) {
        renderMermaid(modalMermaidRef.current, `mermaid-modal-${Date.now()}-${Math.random()}`)
      }
    }, 100)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 300))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25))
  }

  const handleCopyChart = () => {
    navigator.clipboard.writeText(chart)
  }

  const handleDownloadSVG = () => {
    const svgElement = modalMermaidRef.current?.querySelector("svg")
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const blob = new Blob([svgData], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${title || "mermaid-diagram"}.svg`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      {title && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-medium text-slate-700">{title}</h4>
          {diagramType && <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">{diagramType}</span>}
        </div>
      )}

      <div className="relative">
        <div
          ref={mermaidRef}
          className="p-4 min-h-[200px] flex items-center justify-center overflow-auto"
          style={{ maxHeight: "400px" }}
        />

        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyChart}
            className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
            title="Copy Mermaid code"
          >
            <Copy className="h-3 w-3" />
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleModalOpen}
                className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                title="Maximize diagram"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{title || "Mermaid Diagram"}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 25}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-normal min-w-[60px] text-center">{zoom}%</span>
                    <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 300}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadSVG}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="overflow-auto max-h-[calc(90vh-120px)]">
                <div
                  ref={modalMermaidRef}
                  className="flex items-center justify-center p-4"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "center top",
                    minHeight: "200px",
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-600 text-sm">{error}</div>}
    </div>
  )
}
