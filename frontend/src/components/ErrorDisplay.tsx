import React from 'react'
import { parseTtsError } from '@/utils/errorMessages'

interface ErrorDisplayProps {
  error: string | null
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null

  const errorDetails = parseTtsError(error)

  return (
    <div className="w-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-[var(--radius-lg)] p-6 text-center">
      <h4 className="font-heading text-[var(--color-error)] font-semibold text-lg mb-2">{errorDetails.title}</h4>
      <p className="text-sm text-[var(--color-text-primary)] mb-3">{errorDetails.message}</p>
      {errorDetails.suggestion && (
        <p className="text-xs text-[var(--color-text-secondary)] bg-red-100/50 dark:bg-red-900/20 px-4 py-2 rounded-lg border-l-3 border-red-300 dark:border-red-900/50">
          <strong>Suggestion:</strong> {errorDetails.suggestion}
        </p>
      )}
    </div>
  )
}

export default ErrorDisplay
