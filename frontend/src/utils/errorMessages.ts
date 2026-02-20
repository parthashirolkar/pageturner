/**
 * Maps backend error messages to user-friendly explanations
 */

export interface ErrorDetails {
  title: string
  message: string
  suggestion?: string
  icon?: 'access-denied' | 'not-found' | 'timeout' | 'network' | 'content' | 'server'
}

export function parseTtsError(error: string | null | undefined): ErrorDetails {
  if (!error) {
    return {
      title: 'Generation Failed',
      message: 'An unexpected error occurred while generating audio.',
      icon: 'server'
    }
  }

  const lowerError = error.toLowerCase()

  // HTTP 403 - Access denied / blocked
  if (lowerError.includes('403') || lowerError.includes('forbidden')) {
    return {
      title: 'Access Denied',
      message: 'This website is blocking automated requests.',
      suggestion: 'Try copying the article content and pasting it, or use a different URL.',
      icon: 'access-denied'
    }
  }

  // HTTP 404 - Not found
  if (lowerError.includes('404') || lowerError.includes('not found')) {
    return {
      title: 'Page Not Found',
      message: 'The URL could not be found or may have been removed.',
      suggestion: 'Check the URL and try again.',
      icon: 'not-found'
    }
  }

  // Timeout errors
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return {
      title: 'Request Timed Out',
      message: 'The server took too long to respond.',
      suggestion: 'Try again or check if the website is loading slowly.',
      icon: 'timeout'
    }
  }

  // Network errors
  if (lowerError.includes('network') || lowerError.includes('connection') || lowerError.includes('econnrefused')) {
    return {
      title: 'Network Error',
      message: 'Could not connect to the server.',
      suggestion: 'Check your internet connection and try again.',
      icon: 'network'
    }
  }

  // Content extraction failures
  if (lowerError.includes('extract') || lowerError.includes('content') || lowerError.includes('parse')) {
    return {
      title: 'Content Not Readable',
      message: 'Could not extract article content from this page.',
      suggestion: 'Try a different article with readable text, or copy-paste the content directly.',
      icon: 'content'
    }
  }

  // TTS generation failures
  if (lowerError.includes('audio') || lowerError.includes('tts') || lowerError.includes('generation')) {
    return {
      title: 'Audio Generation Failed',
      message: 'Failed to generate audio from the content.',
      suggestion: 'The text may be too long or contain unsupported characters. Try a shorter article.',
      icon: 'server'
    }
  }

  // Rate limiting
  if (lowerError.includes('rate limit') || lowerError.includes('too many requests')) {
    return {
      title: 'Too Many Requests',
      message: 'You are making requests too quickly.',
      suggestion: 'Please wait a moment and try again.',
      icon: 'server'
    }
  }

  // Server errors (5xx)
  if (lowerError.includes('500') || lowerError.includes('502') || lowerError.includes('503')) {
    return {
      title: 'Server Error',
      message: 'The TTS service encountered an error.',
      suggestion: 'This is not your fault. Please try again in a few moments.',
      icon: 'server'
    }
  }

  // Default - show the original error but make it friendly
  return {
    title: 'Generation Failed',
    message: error,
    icon: 'server'
  }
}
