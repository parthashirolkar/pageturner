import { apiClient, handleApiError } from './client'
import { TTSRequest, TTSResponse, HealthResponse, JobStatusResponse } from '@/types/api'
import { AxiosError } from 'axios'

export const ttsApi = {
  async generateAudio(url: string): Promise<TTSResponse> {
    try {
      const payload: TTSRequest = { url }
      const response = await apiClient.post<TTSResponse>('/tts', payload)
      return response.data
    } catch (error) {
      const message = handleApiError(error as AxiosError)
      throw new Error(message)
    }
  },

  async checkStatus(jobId: string): Promise<JobStatusResponse> {
    try {
      const response = await apiClient.get<JobStatusResponse>(`/status/${jobId}`)
      return response.data
    } catch (error) {
      const message = handleApiError(error as AxiosError)
      throw new Error(message)
    }
  },

  async downloadAudio(audioId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`/download/${audioId}`, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      const message = handleApiError(error as AxiosError)
      throw new Error(message)
    }
  },

  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await apiClient.get<HealthResponse>('/health')
      return response.data
    } catch (error) {
      const message = handleApiError(error as AxiosError)
      throw new Error(message)
    }
  }
}
