import axios, { AxiosInstance, AxiosError } from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 120000
})

export const handleApiError = (error: AxiosError): string => {
  if (error.response) {
    const data = error.response.data as { error?: string; message?: string }
    return data.error || data.message || `Error ${error.response.status}: ${error.response.statusText}`
  } else if (error.request) {
    return 'Unable to connect to server. Please check your connection.'
  } else {
    return 'An unexpected error occurred. Please try again.'
  }
}
