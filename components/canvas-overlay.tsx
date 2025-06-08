"use client"

import { useRef } from "react"
import { Stage, Layer, Rect, Circle, Line, Text } from "react-konva"
import { useCalibrationStore } from "@/lib/store"

export default function CanvasOverlay() {
  const stageRef = useRef(null)
  const { currentInference, currentTracker, regions } = useCalibrationStore()

  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600

  // Draw regions (bed, door, risk zones)
  const renderRegions = () => {
    if (!regions) return null

    return Object.entries(regions).map(([regionName, region]) => {
      const color =
        regionName === "bed"
          ? "rgba(0, 100, 255, 0.2)"
          : regionName === "door"
            ? "rgba(255, 100, 0, 0.2)"
            : "rgba(255, 255, 0, 0.2)"

      // Draw region using keypoints if available, otherwise bbox
      if (region.keypoints && region.keypoints.length >= 4) {
        const points = region.keypoints.flat()
        return (
          <Line
            key={regionName}
            points={points}
            fill={color}
            stroke={color.replace("0.2", "0.8")}
            strokeWidth={2}
            closed={true}
          />
        )
      } else if (region.bbox) {
        const [x, y, w, h] = region.bbox
        return (
          <Rect
            key={regionName}
            x={x}
            y={y}
            width={w}
            height={h}
            fill={color}
            stroke={color.replace("0.2", "0.8")}
            strokeWidth={2}
          />
        )
      }
      return null
    })
  }

  // Draw raw inference bounding boxes (red)
  const renderRawDetections = () => {
    if (!currentInference?.detections) return null

    return currentInference.detections.map((detection, idx) => (
      <g key={`raw-${idx}`}>
        <Rect
          x={detection.bbox[0]}
          y={detection.bbox[1]}
          width={detection.bbox[2]}
          height={detection.bbox[3]}
          stroke="red"
          strokeWidth={2}
          fill="rgba(255, 0, 0, 0.1)"
        />
        <Text
          x={detection.bbox[0]}
          y={detection.bbox[1] - 20}
          text={`Raw P${detection.person_id} (${detection.confidence.toFixed(2)})`}
          fontSize={12}
          fill="red"
        />
      </g>
    ))
  }

  // Draw smoothed tracker bounding boxes (green)
  const renderTrackedDetections = () => {
    if (!currentTracker?.tracks) return null

    return currentTracker.tracks.map((track, idx) => (
      <g key={`track-${idx}`}>
        <Rect
          x={track.bbox_smoothed[0]}
          y={track.bbox_smoothed[1]}
          width={track.bbox_smoothed[2]}
          height={track.bbox_smoothed[3]}
          stroke="green"
          strokeWidth={2}
          fill="rgba(0, 255, 0, 0.1)"
        />
        <Text
          x={track.bbox_smoothed[0]}
          y={track.bbox_smoothed[1] - 20}
          text={`Track P${track.person_id} (${track.stability?.toFixed(2) || "N/A"})`}
          fontSize={12}
          fill="green"
        />
      </g>
    ))
  }

  // Draw keypoints (yellow, opacity based on confidence)
  const renderKeypoints = () => {
    if (!currentInference?.detections) return null

    return currentInference.detections.map((detection, detIdx) => {
      if (!detection.keypoints) return null

      return detection.keypoints.map((keypoint, kpIdx) => {
        if (!keypoint.x || !keypoint.y) return null

        const opacity = keypoint.conf || 0.5
        return (
          <Circle
            key={`kp-${detIdx}-${kpIdx}`}
            x={keypoint.x}
            y={keypoint.y}
            radius={4}
            fill={`rgba(255, 255, 0, ${opacity})`}
            stroke="orange"
            strokeWidth={1}
          />
        )
      })
    })
  }

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={stageRef}>
        <Layer>
          {/* Background grid */}
          <Rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#1a1a1a" />

          {/* Grid lines */}
          {Array.from({ length: 20 }, (_, i) => (
            <Line
              key={`grid-v-${i}`}
              points={[i * 40, 0, i * 40, CANVAS_HEIGHT]}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: 15 }, (_, i) => (
            <Line
              key={`grid-h-${i}`}
              points={[0, i * 40, CANVAS_WIDTH, i * 40]}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={1}
            />
          ))}

          {/* Regions */}
          {renderRegions()}

          {/* Raw detections */}
          {renderRawDetections()}

          {/* Tracked detections */}
          {renderTrackedDetections()}

          {/* Keypoints */}
          {renderKeypoints()}
        </Layer>
      </Stage>
    </div>
  )
}
