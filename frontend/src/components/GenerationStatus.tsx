import React from 'react'
import { FileText, CheckCircle2, Loader2, Clock, Waves } from 'lucide-react'
import type { JobStatusResponse } from '@/types/api'

interface TTSResult {
  audio_id: string
  title: string
  text_length: number
  estimated_duration: number
}

interface GenerationStatusProps {
  isLoading: boolean
  result: TTSResult | null
  isAudioLoading: boolean
  jobStatus: JobStatusResponse | null
}

const GenerationStatus: React.FC<GenerationStatusProps> = ({ isLoading, result, isAudioLoading, jobStatus }) => {
  const getStatusMessage = (status: string, progress?: number): string => {
    switch (status) {
      case 'pending':
        return 'Initializing...'
      case 'processing':
        return progress !== undefined 
          ? `Generating narration... ${progress}%`
          : 'Generating narration...'
      case 'completed':
        return 'Complete!'
      case 'failed':
        return 'Failed'
      default:
        return 'Processing...'
    }
  }

  const getStatusTitle = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Starting Up'
      case 'processing':
        return 'Creating Your Audio'
      default:
        return 'Processing'
    }
  }

  if (jobStatus) {
    const progress = jobStatus.progress ?? 0
    const displayProgress = progress === 0 ? 5 : progress // Visual minimum
    const statusMessage = getStatusMessage(jobStatus.status, jobStatus.progress ?? undefined)
    const statusTitle = getStatusTitle(jobStatus.status)

    return (
      <div className="w-full bg-[var(--color-bg-secondary)] rounded-[var(--radius-lg)] p-8 border border-[var(--color-bg-tertiary)] text-center space-y-6 animate-fade-in">
        <div className="relative">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--color-accent-primary)] opacity-20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-bg-primary)] border-2 border-[var(--color-accent-primary)]">
                <Loader2 size={36} className="animate-spin text-[var(--color-accent-primary)]" />
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-heading text-[var(--color-text-primary)] mb-2">{statusTitle}</h3>
          <p className="text-[var(--color-text-secondary)] mb-6">{statusMessage}</p>

          <div className="max-w-md mx-auto">
            <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${displayProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-[var(--color-text-tertiary)]">
              <span>Started</span>
              <span className="font-medium">{progress > 0 ? `${progress}%` : 'Initializing...'}</span>
              <span>Almost there</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--color-bg-tertiary)]">
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-[var(--color-bg-primary)] flex items-center justify-center text-[var(--color-text-tertiary)]">
              <Waves size={16} />
            </div>
            <span className="text-xs text-[var(--color-text-secondary)]">Extracting</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              jobStatus.status === 'processing' || jobStatus.status === 'completed'
                ? 'bg-[var(--color-accent-primary)] text-white'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)]'
            }`}>
              <Loader2 size={16} className={jobStatus.status === 'processing' ? 'animate-spin' : ''} />
            </div>
            <span className="text-xs text-[var(--color-text-secondary)]">Generating</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              jobStatus.status === 'completed'
                ? 'bg-[var(--color-success)] text-white'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)]'
            }`}>
              <CheckCircle2 size={16} />
            </div>
            <span className="text-xs text-[var(--color-text-secondary)]">Ready</span>
          </div>
        </div>
      </div>
    )
  }

  // Show loading only if we don't have a result yet (initial generation phase)
  if (isLoading && !result) {
    return (
      <div className="w-full bg-[var(--color-bg-secondary)] rounded-[var(--radius-lg)] p-8 border border-[var(--color-bg-tertiary)] text-center space-y-4 animate-fade-in">
        <div className="inline-flex p-4 rounded-full bg-[var(--color-bg-primary)] text-[var(--color-accent-primary)] mb-2 relative">
          <Loader2 size={32} className="animate-spin" />
        </div>
        <h3 className="text-xl font-heading text-[var(--color-text-primary)]">Analyzing Content</h3>
        <p className="text-[var(--color-text-secondary)]">Extracting text and preparing narration model...</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full animate-fade-in">
        <div className="card flex flex-col items-center text-center space-y-2 p-6 hover:border-[var(--color-accent-secondary)] transition-colors">
          <div className="p-3 bg-[var(--color-bg-primary)] rounded-full text-[var(--color-accent-secondary)]">
            <FileText size={24} />
          </div>
          <div className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wide font-bold">Source</div>
          <div className="font-heading text-lg text-[var(--color-text-primary)] line-clamp-1" title={result.title}>
            {result.title || "Untitled Article"}
          </div>
        </div>

        <div className="card flex flex-col items-center text-center space-y-2 p-6 hover:border-[var(--color-accent-tertiary)] transition-colors">
          <div className="p-3 bg-[var(--color-bg-primary)] rounded-full text-[var(--color-accent-tertiary)]">
            <Clock size={24} />
          </div>
          <div className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wide font-bold">Duration</div>
          <div className="font-heading text-lg text-[var(--color-text-primary)]">
            ~{Math.ceil(result.estimated_duration)}s
          </div>
        </div>

        <div className="card flex flex-col items-center text-center space-y-2 p-6 hover:border-[var(--color-success)] transition-colors">
          <div className="p-3 bg-[var(--color-bg-primary)] rounded-full text-[var(--color-success)]">
            {isAudioLoading ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wide font-bold">Status</div>
          <div className="font-heading text-lg text-[var(--color-text-primary)]">
            {isAudioLoading ? 'Downloading...' : 'Ready to Play'}
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default GenerationStatus
