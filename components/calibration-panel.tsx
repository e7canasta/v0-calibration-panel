"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Square, Download } from "lucide-react"
import { useCalibrationStore } from "@/lib/store"
import CanvasOverlay from "./canvas-overlay"
import LiveMetrics from "./live-metrics"
import Timeline from "./timeline"
import EventLog from "./event-log"

export default function CalibrationPanel() {
  const { isLive, isPaused, currentFrame, toggleLive, togglePause, createClip, connectWebSocket, disconnectWebSocket } =
    useCalibrationStore()

  useEffect(() => {
    connectWebSocket()
    return () => disconnectWebSocket()
  }, [connectWebSocket, disconnectWebSocket])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Panel de Calibración</h1>
            <Badge variant={isLive ? "default" : "secondary"}>{isLive ? "LIVE" : "PAUSED"}</Badge>
            {currentFrame && (
              <span className="text-sm text-gray-500">
                Frame: {currentFrame.frame_id} | {new Date(currentFrame.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onClick={toggleLive}
              className="flex items-center gap-2"
            >
              {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isLive ? "Pausar" : "Live"}
            </Button>

            <Button variant="outline" size="sm" onClick={createClip} className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              Clip 2min
            </Button>

            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Panel - Canvas */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Vista Espacial</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-2">
              <CanvasOverlay />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Timeline (2 min buffer)</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <Timeline />
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Metrics & Events */}
        <div className="w-80 flex flex-col gap-4">
          <LiveMetrics />
          <EventLog />
        </div>
      </div>
    </div>
  )
}
