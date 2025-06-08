"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { useCalibrationStore } from "@/lib/store"

export default function Timeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { frameBuffer, currentFrameIndex, isLive, seekToFrame } = useCalibrationStore()

  const TIMELINE_WIDTH = 760
  const TIMELINE_HEIGHT = 120
  const BUFFER_DURATION = 120 // 2 minutes
  const TARGET_FPS = 6

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, TIMELINE_WIDTH, TIMELINE_HEIGHT)

    // Draw background
    ctx.fillStyle = "#f3f4f6"
    ctx.fillRect(0, 0, TIMELINE_WIDTH, TIMELINE_HEIGHT)

    // Draw grid lines (every 10 seconds)
    ctx.strokeStyle = "#d1d5db"
    ctx.lineWidth = 1
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * TIMELINE_WIDTH
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, TIMELINE_HEIGHT)
      ctx.stroke()
    }

    // Draw time labels
    ctx.fillStyle = "#6b7280"
    ctx.font = "10px monospace"
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * TIMELINE_WIDTH
      const seconds = i * 10
      ctx.fillText(`${seconds}s`, x + 2, 12)
    }

    // Draw confidence histogram
    if (frameBuffer.length > 0) {
      const barWidth = TIMELINE_WIDTH / (BUFFER_DURATION * TARGET_FPS)

      frameBuffer.forEach((frame, index) => {
        const x = index * barWidth
        const avgConfidence =
          frame.inference?.detections?.reduce((sum, d) => sum + d.confidence, 0) /
            (frame.inference?.detections?.length || 1) || 0
        const height = avgConfidence * 40

        // Confidence bar
        ctx.fillStyle = frame.inference?.detections?.length ? "#3b82f6" : "#ef4444"
        ctx.fillRect(x, 30, Math.max(barWidth - 1, 1), height)

        // Detection count indicator
        const detectionCount = frame.inference?.detections?.length || 0
        if (detectionCount > 0) {
          ctx.fillStyle = "#10b981"
          ctx.fillRect(x, 75, Math.max(barWidth - 1, 1), detectionCount * 5)
        }

        // Event markers
        if (frame.tracker?.event) {
          ctx.fillStyle = "#f59e0b"
          ctx.fillRect(x, 85, Math.max(barWidth - 1, 1), 10)
        }
      })
    }

    // Draw current position indicator
    if (!isLive && currentFrameIndex !== null) {
      const x = (currentFrameIndex / (BUFFER_DURATION * TARGET_FPS)) * TIMELINE_WIDTH
      ctx.strokeStyle = "#dc2626"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, TIMELINE_HEIGHT)
      ctx.stroke()
    }

    // Draw legend
    ctx.fillStyle = "#374151"
    ctx.font = "10px sans-serif"
    ctx.fillText("Azul: Confianza | Verde: Detecciones | Amarillo: Eventos", 10, TIMELINE_HEIGHT - 5)
  }, [frameBuffer, currentFrameIndex, isLive])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const frameIndex = Math.floor((x / TIMELINE_WIDTH) * BUFFER_DURATION * TARGET_FPS)

    seekToFrame(frameIndex)
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={TIMELINE_WIDTH}
        height={TIMELINE_HEIGHT}
        className="border border-gray-300 rounded cursor-pointer"
        onClick={handleCanvasClick}
      />
      <div className="text-xs text-gray-500 text-center">
        {isLive ? "Timeline en vivo - Pausa para navegar" : "Click para navegar en el tiempo"}
      </div>
    </div>
  )
}
