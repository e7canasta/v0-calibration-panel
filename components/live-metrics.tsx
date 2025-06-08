"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCalibrationStore } from "@/lib/store"

export default function LiveMetrics() {
  const { currentInference, currentTracker, metrics } = useCalibrationStore()

  const detectionCount = currentInference?.detections?.length || 0
  const trackCount = currentTracker?.tracks?.length || 0
  const avgConfidence = currentInference?.detections?.reduce((sum, d) => sum + d.confidence, 0) / detectionCount || 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Métricas Live</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* FPS and Frame Info */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{metrics.fps.toFixed(1)}</div>
            <div className="text-xs text-gray-500">FPS</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-green-600">{detectionCount}</div>
            <div className="text-xs text-gray-500">Detecciones</div>
          </div>
        </div>

        {/* Confidence */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Confianza Promedio</span>
            <span className="font-mono">{avgConfidence.toFixed(3)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${avgConfidence * 100}%` }}
            />
          </div>
        </div>

        {/* Active Tracks */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Tracks Activos ({trackCount})</div>
          {currentTracker?.tracks?.map((track, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span>Persona {track.person_id}</span>
              <Badge variant="outline" className="text-xs">
                {track.stability?.toFixed(2) || "N/A"}
              </Badge>
            </div>
          ))}
        </div>

        {/* Regions Status */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Estado de Regiones</div>
          {currentTracker?.regions &&
            Object.entries(currentTracker.regions).map(([name, region]) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="capitalize">{name}</span>
                <Badge variant={region.occupied ? "default" : "secondary"}>
                  {region.occupied ? "Ocupada" : "Libre"}
                </Badge>
              </div>
            ))}
        </div>

        {/* Drop Frames */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Frames Perdidos</span>
            <span className="font-mono text-red-600">{metrics.droppedFrames}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
