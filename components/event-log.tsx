"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCalibrationStore } from "@/lib/store"

export default function EventLog() {
  const { eventHistory } = useCalibrationStore()

  const getEventBadgeVariant = (eventType: string) => {
    switch (eventType) {
      case "limb_outside_bed":
        return "destructive"
      case "bed_exit":
        return "destructive"
      case "bed_entry":
        return "default"
      case "door_crossed":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatEventPayload = (payload: any) => {
    if (!payload) return ""

    const details = []
    if (payload.keypoints_outside) {
      details.push(`Keypoints: ${payload.keypoints_outside.join(", ")}`)
    }
    if (payload.distance_cm) {
      details.push(`Distancia: ${payload.distance_cm}cm`)
    }
    if (payload.confidence) {
      details.push(`Confianza: ${payload.confidence.toFixed(2)}`)
    }
    if (payload.imov) {
      details.push(`IMOV: ${payload.imov.toFixed(2)}`)
    }

    return details.join(" | ")
  }

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Log de Eventos</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="space-y-2 p-4">
            {eventHistory.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">No hay eventos registrados</div>
            ) : (
              eventHistory
                .slice()
                .reverse()
                .map((event, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={getEventBadgeVariant(event.event)}>{event.event}</Badge>
                      <span className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>

                    {event.event_payload && (
                      <div className="text-xs text-gray-600">{formatEventPayload(event.event_payload)}</div>
                    )}

                    {event.event_payload?.person_id && (
                      <div className="text-xs">
                        <span className="font-medium">Persona ID:</span> {event.event_payload.person_id}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
