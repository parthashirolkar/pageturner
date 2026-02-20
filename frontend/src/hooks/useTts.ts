import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient, handleApiError } from '../api/client'
import type { JobStatusResponse } from '@/types/api'

interface TTSResult {
  audio_id: string
  title: string
  text_length: number
  estimated_duration: number
}

interface TTSResponse {
  job_id: string
  status: string
  message: string
}

const POLL_INTERVAL = 2000

export const useTts = () => {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TTSResult | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDownloadingRef = useRef(false)
  const completedJobIdsRef = useRef(new Set<string>())
  const abortControllerRef = useRef<AbortController | null>(null)

  const downloadAudio = useCallback(async (audioId: string) => {
    if (isDownloadingRef.current) {
      console.log('Download already in progress, skipping duplicate request')
      return
    }

    try {
      isDownloadingRef.current = true
      setIsAudioLoading(true)
      const audioResponse = await apiClient.get(`/download/${audioId}`, {
        responseType: 'blob'
      })
      
      const audioBlob = new Blob([audioResponse.data], { type: 'audio/mpeg' })
      const audioObjectUrl = URL.createObjectURL(audioBlob)
      setAudioUrl(audioObjectUrl)
    } catch (err: any) {
      console.error(err)
      setError(handleApiError(err))
    } finally {
      setIsAudioLoading(false)
      isDownloadingRef.current = false
    }
  }, [])

  const startPolling = useCallback((id: string) => {
    const poll = async () => {
      console.log(`[Polling] Starting status check for job ${id}`)
      const currentAbortController = new AbortController()
      abortControllerRef.current = currentAbortController

      try {
        console.log(`[Polling] Checking status for job ${id}`)
        const { data } = await apiClient.get<JobStatusResponse>(`/status/${id}`, {
          signal: currentAbortController.signal
        })
        console.log(`[Polling] Status response:`, data.status, `Progress: ${data.progress}%`)
        
        if (data.status === 'completed' && data.audio_id) {
          if (completedJobIdsRef.current.has(data.job_id)) {
            console.log('Job already processed, clearing timeout and skipping duplicate handling')
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
              timeoutRef.current = null
            }
            setJobStatus(null)
            setIsLoading(false)
            return
          }

          completedJobIdsRef.current.add(data.job_id)
          console.log(`[Polling] Job ${id} completed successfully, stopping polling`)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
          setJobStatus(null)
          setResult({
            audio_id: data.audio_id,
            title: data.title || 'Audio',
            text_length: data.text_length || 0,
            estimated_duration: data.estimated_duration || 0
          })
          setIsLoading(false)
          await downloadAudio(data.audio_id)
        } else if (data.status === 'failed') {
          console.log(`[Polling] Job ${id} failed`)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
          setJobStatus(null)
          setIsLoading(false)
          setError(data.error || data.message || 'Generation failed')
        } else {
          setJobStatus(data)
          // Only schedule next poll if we are still the active controller
          if (abortControllerRef.current === currentAbortController) {
             timeoutRef.current = setTimeout(poll, POLL_INTERVAL)
          } else {
             console.log('[Polling] Loop stopped because a new job started')
          }
        }
      } catch (err: any) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED' || err.message?.includes('abort')) {
          if (currentAbortController.signal.aborted) {
            console.log(`[Polling] Request explicitly aborted by cleanup/user for job ${id}`)
            return
          }
          console.warn(`[Polling] Request aborted by browser/network for job ${id}, retrying...`)
          
          // Only retry if we are still the active controller
          if (abortControllerRef.current === currentAbortController) {
            timeoutRef.current = setTimeout(poll, POLL_INTERVAL)
          }
          return
        }
        console.error(`[Polling] Error checking status for job ${id}:`, err)
        console.error(err)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        setJobStatus(null)
        setIsLoading(false)
        setError(handleApiError(err))
      } finally {
        if (abortControllerRef.current === currentAbortController) {
          abortControllerRef.current = null
        }
      }
    }

    poll()
  }, [downloadAudio])

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setAudioUrl(null)
    setJobStatus(null)
    
    // Clear history of completed jobs for this new session
    completedJobIdsRef.current.clear()

    try {
      // Abort any existing in-flight requests from previous jobs
      if (abortControllerRef.current) {
        console.log('[useTts] Aborting previous job request before starting new one')
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }

      if (timeoutRef.current) {
        console.log('[useTts] Clearing existing timeout before starting new one')
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      const { data } = await apiClient.post<TTSResponse>('/tts', { url: url.trim() })
      
      console.log('[useTts] Starting polling for job:', data.job_id)
      startPolling(data.job_id)
    } catch (err: any) {
      console.error(err)
      setError(handleApiError(err))
      setIsLoading(false)
      setJobStatus(null)
    }
  }

  const handleRetry = () => {
    if (url) {
      handleSubmit()
    }
  }

  useEffect(() => {
    return () => {
      console.log('[useTts] Cleanup triggered')
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        console.log('[useTts] Aborting in-flight request')
        abortControllerRef.current.abort()
      }
    }
  }, [audioUrl])

  return {
    url,
    setUrl,
    isLoading,
    error,
    result,
    audioUrl,
    isAudioLoading,
    jobStatus,
    handleSubmit,
    handleRetry
  }
}
