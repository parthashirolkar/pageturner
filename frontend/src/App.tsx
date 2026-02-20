import { useEffect, useState } from 'react'
import { ThemeProvider } from './hooks/useTheme'
import Header from './components/Header'
import UrlInput from './components/UrlInput'
import GenerationStatus from './components/GenerationStatus'
import AudioPlayer from './components/AudioPlayer'
import ErrorDisplay from './components/ErrorDisplay'
import { useTts } from './hooks/useTts'

function App() {
  const {
    url,
    setUrl,
    isLoading,
    error,
    result,
    audioUrl,
    isAudioLoading,
    jobStatus,
    handleSubmit
  } = useTts()

  // Simple animation state
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <ThemeProvider>
      <div className={`min-h-screen transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <Header />
        
        <main className="container-custom py-12 md:py-20 flex flex-col items-center justify-start min-h-[calc(100vh-80px)]">
          <div className="w-full max-w-2xl space-y-12">
            
            {/* Hero Section */}
            <div className="text-center space-y-6 animate-slide-up">
              <h1 className="text-4xl md:text-6xl text-[var(--color-text-primary)] leading-tight">
                Listen to the <span className="text-[var(--color-accent-primary)] italic">Web</span>
              </h1>
              <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-lg mx-auto leading-relaxed">
                Transform any article into a narrated audio experience. 
                Distraction-free listening for the curious mind.
              </p>
            </div>

            {/* Input Section */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <UrlInput 
                url={url} 
                setUrl={setUrl} 
                onSubmit={handleSubmit} 
                isLoading={isLoading} 
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="animate-fade-in">
                <ErrorDisplay error={error} />
              </div>
            )}

            {/* Status & Result */}
            {(isLoading || result || jobStatus) && (
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <GenerationStatus 
                  isLoading={isLoading} 
                  result={result} 
                  isAudioLoading={isAudioLoading}
                  jobStatus={jobStatus}
                />
              </div>
            )}

            {/* Audio Player */}
            {audioUrl && result && (
              <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <AudioPlayer 
                  audioUrl={audioUrl} 
                  title={result.title} 
                  duration={result.estimated_duration}
                />
              </div>
            )}

          </div>
        </main>
        
        <footer className="py-8 text-center text-[var(--color-text-secondary)] text-sm opacity-60">
          <p>© {new Date().getFullYear()} PageTurner • Powered by Qwen3-TTS</p>
        </footer>
      </div>
    </ThemeProvider>
  )
}

export default App
