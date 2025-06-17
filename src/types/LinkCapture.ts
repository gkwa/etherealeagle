export interface CapturedLink {
  id?: string
  sourceUrl: string
  targetUrl: string
  timestamp: number
  createdAt: string
}

export interface LinkCaptureEvent {
  type: "LINK_CAPTURED"
  data: CapturedLink
}
