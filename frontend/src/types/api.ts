export interface TTSRequest {
  url: string
}

export interface TTSResponse {
  job_id: string
  status: string
  message: string
}

export interface JobStatusResponse {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  audio_id?: string
  progress?: number
  message?: string
  error?: string
  title?: string
  text_length?: number
  estimated_duration?: number
  url?: string
  created_at?: string
  completed_at?: string
}

export interface HealthResponse {
  status: string
  model: string
}

export type Theme = 'light' | 'dark'

export interface AudioState {
  isPlaying: boolean
  currentTime: number
  duration: number
  progress: number
}
