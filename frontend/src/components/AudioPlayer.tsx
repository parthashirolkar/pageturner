import React, { useRef, useState, useEffect } from 'react'
import { Play, Pause, Download, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'

interface AudioPlayerProps {
  audioUrl: string
  title: string
  duration: number
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, title, duration }) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume] = useState(1)
  const [actualDuration, setActualDuration] = useState<number>(0)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      // Auto-play when ready
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
  }, [audioUrl])

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setActualDuration(audioRef.current.duration)
    }
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-[var(--color-bg-primary)] rounded-[var(--radius-lg)] shadow-xl overflow-hidden border border-[var(--color-bg-tertiary)]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      
      {/* Visualizer / Artwork placeholder area */}
      <div className="h-32 bg-[var(--color-bg-secondary)] relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="z-10 text-center px-4">
          <h3 className="font-heading text-xl md:text-2xl text-[var(--color-text-primary)] line-clamp-1">{title}</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">AI Narrator • Qwen3-TTS</p>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 space-y-6">
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-[var(--color-text-secondary)]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(actualDuration || duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={actualDuration || duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-full appearance-none cursor-pointer accent-[var(--color-accent-primary)] hover:accent-[var(--color-accent-primary)]"
          />
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between">
          
          <button onClick={toggleMute} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 10 }}
              className="text-[var(--color-text-primary)] hover:text-[var(--color-accent-primary)] transition-colors"
            >
              <SkipBack size={24} />
            </button>

            <button 
              onClick={togglePlay}
              className="w-16 h-16 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-full flex items-center justify-center hover:bg-[var(--color-accent-primary)] hover:scale-105 transition-all shadow-lg"
            >
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>

            <button 
              onClick={() => { if(audioRef.current) audioRef.current.currentTime += 10 }}
              className="text-[var(--color-text-primary)] hover:text-[var(--color-accent-primary)] transition-colors"
            >
              <SkipForward size={24} />
            </button>
          </div>

          <button onClick={handleDownload} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors" title="Download MP3">
            <Download size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AudioPlayer
