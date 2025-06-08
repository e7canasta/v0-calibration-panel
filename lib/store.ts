"use client"

import { create } from "zustand"

interface Keypoint {
  name?: string
  x: number
  y: number
  conf: number
}

interface Detection {
  person_id: number
  bbox: [number, number, number, number]
  keypoints?: Keypoint[]
  confidence: number
  imov?: number
}

interface InferenceData {
  timestamp: number
  frame_id: number
  detections: Detection[]
}

interface Track {
  person_id: number
  bbox_smoothed: [number, number, number, number]
  keypoints?: Keypoint[]
  stability?: number
}

interface Region {
  occupied: boolean
  confidence?: number
  bbox?: [number, number, number, number]
  keypoints?: number[][]
}

interface TrackerData {
  timestamp: number
  event?: string
  event_payload?: any
  regions: Record<string, Region>
  tracks: Track[]
}

interface FrameData {
  timestamp: number
  inference?: InferenceData
  tracker?: TrackerData
}

interface Metrics {
  fps: number
  droppedFrames: number
  avgConfidence: number
  activeDetections: number
}

interface CalibrationStore {
  // State
  isLive: boolean
  isPaused: boolean
  currentInference: InferenceData | null
  currentTracker: TrackerData | null
  currentFrame: FrameData | null
  frameBuffer: FrameData[]
  eventHistory: TrackerData[]
  currentFrameIndex: number | null
  metrics: Metrics
  regions: Record<string, Region>

  // WebSocket
  ws: WebSocket | null

  // Actions
  toggleLive: () => void
  togglePause: () => void
  createClip: () => void
  seekToFrame: (index: number) => void
  connectWebSocket: () => void
  disconnectWebSocket: () => void
  addFrameToBuffer: (frame: FrameData) => void
  updateMetrics: () => void
}

export const useCalibrationStore = create<CalibrationStore>((set, get) => ({
  // Initial state
  isLive: true,
  isPaused: false,
  currentInference: null,
  currentTracker: null,
  currentFrame: null,
  frameBuffer: [],
  eventHistory: [],
  currentFrameIndex: null,
  metrics: {
    fps: 0,
    droppedFrames: 0,
    avgConfidence: 0,
    activeDetections: 0,
  },
  regions: {},
  ws: null,

  toggleLive: () => {
    const { isLive } = get()
    set({
      isLive: !isLive,
      isPaused: false,
      currentFrameIndex: isLive ? get().frameBuffer.length - 1 : null,
    })
  },

  togglePause: () => {
    set((state) => ({ isPaused: !state.isPaused }))
  },

  createClip: () => {
    const { frameBuffer } = get()
    console.log("Creating clip with", frameBuffer.length, "frames")
    // Here you would implement clip creation logic
  },

  seekToFrame: (index: number) => {
    const { frameBuffer, isLive } = get()
    if (isLive || index < 0 || index >= frameBuffer.length) return

    const frame = frameBuffer[index]
    set({
      currentFrameIndex: index,
      currentFrame: frame,
      currentInference: frame.inference || null,
      currentTracker: frame.tracker || null,
      regions: frame.tracker?.regions || {},
    })
  },

  connectWebSocket: () => {
    // Simulate WebSocket connection for demo
    const simulateData = () => {
      const timestamp = Date.now()
      const frame_id = Math.floor(timestamp / 1000) * 6 + Math.floor(Math.random() * 6)

      // Simulate inference data
      const detections: Detection[] = []
      if (Math.random() > 0.3) {
        // 70% chance of detection
        detections.push({
          person_id: 1,
          bbox: [
            200 + Math.random() * 200,
            150 + Math.random() * 200,
            160 + Math.random() * 40,
            280 + Math.random() * 60,
          ],
          keypoints: Array.from({ length: 17 }, (_, i) => ({
            name: `keypoint_${i}`,
            x: 300 + Math.random() * 200,
            y: 200 + Math.random() * 200,
            conf: 0.5 + Math.random() * 0.5,
          })),
          confidence: 0.5 + Math.random() * 0.5,
          imov: Math.random() * 0.5,
        })
      }

      const inference: InferenceData = {
        timestamp,
        frame_id,
        detections,
      }

      // Simulate tracker data
      const regions: Record<string, Region> = {
        bed: {
          occupied: detections.length > 0 && Math.random() > 0.5,
          confidence: 0.8 + Math.random() * 0.2,
          bbox: [400, 300, 400, 300],
          keypoints: [
            [400, 300],
            [800, 300],
            [800, 600],
            [400, 600],
          ],
        },
        door: {
          occupied: false,
          bbox: [50, 50, 150, 200],
          keypoints: [
            [50, 50],
            [200, 50],
            [200, 250],
            [50, 250],
          ],
        },
      }

      const tracker: TrackerData = {
        timestamp,
        regions,
        tracks: detections.map((d) => ({
          person_id: d.person_id,
          bbox_smoothed: d.bbox,
          keypoints: d.keypoints,
          stability: 0.7 + Math.random() * 0.3,
        })),
      }

      // Occasionally add events
      if (Math.random() > 0.9) {
        tracker.event = "limb_outside_bed"
        tracker.event_payload = {
          person_id: 1,
          keypoints_outside: ["left_hand"],
          distance_cm: 30 + Math.random() * 50,
          confidence: 0.8 + Math.random() * 0.2,
        }
      }

      const frame: FrameData = {
        timestamp,
        inference,
        tracker,
      }

      get().addFrameToBuffer(frame)

      if (get().isLive) {
        set({
          currentFrame: frame,
          currentInference: inference,
          currentTracker: tracker,
          regions,
        })
      }

      if (tracker.event) {
        set((state) => ({
          eventHistory: [...state.eventHistory, tracker].slice(-50), // Keep last 50 events
        }))
      }

      get().updateMetrics()
    }

    // Simulate 6 FPS with some jitter
    const interval = setInterval(simulateData, 150 + Math.random() * 50)

    set({ ws: { close: () => clearInterval(interval) } as any })
  },

  disconnectWebSocket: () => {
    const { ws } = get()
    if (ws) {
      ws.close()
      set({ ws: null })
    }
  },

  addFrameToBuffer: (frame: FrameData) => {
    set((state) => {
      const newBuffer = [...state.frameBuffer, frame]
      // Keep only last 2 minutes at 6 FPS (720 frames)
      const maxFrames = 120 * 6
      return {
        frameBuffer: newBuffer.slice(-maxFrames),
      }
    })
  },

  updateMetrics: () => {
    const { frameBuffer } = get()
    if (frameBuffer.length < 2) return

    const recentFrames = frameBuffer.slice(-30) // Last 5 seconds at 6 FPS
    const timeSpan = recentFrames[recentFrames.length - 1].timestamp - recentFrames[0].timestamp
    const fps = (recentFrames.length - 1) / (timeSpan / 1000)

    const detections = recentFrames.flatMap((f) => f.inference?.detections || [])
    const avgConfidence =
      detections.length > 0 ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length : 0

    const droppedFrames = recentFrames.filter((f) => !f.inference?.detections?.length).length

    set({
      metrics: {
        fps: fps || 0,
        droppedFrames,
        avgConfidence,
        activeDetections: frameBuffer[frameBuffer.length - 1]?.inference?.detections?.length || 0,
      },
    })
  },
}))
