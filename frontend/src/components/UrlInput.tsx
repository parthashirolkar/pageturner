import React, { KeyboardEvent } from 'react'
import { ArrowRight, Loader2, Link } from 'lucide-react'

interface UrlInputProps {
  url: string
  setUrl: (url: string) => void
  onSubmit: () => void
  isLoading: boolean
}

const UrlInput: React.FC<UrlInputProps> = ({ url, setUrl, onSubmit, isLoading }) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && url) {
      onSubmit()
    }
  }

  return (
    <div className="w-full relative group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Link className="text-[var(--color-text-secondary)] opacity-50" size={20} />
      </div>
      
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste article URL here..."
        className="w-full bg-[var(--color-bg-secondary)] border-2 border-transparent 
                   text-[var(--color-text-primary)] pl-12 pr-32 py-5 rounded-[var(--radius-lg)]
                   text-lg shadow-sm
                   placeholder-[var(--color-text-secondary)] 
                   focus:outline-none focus:border-[var(--color-accent-primary)]
                   transition-all duration-300"
        disabled={isLoading}
      />

      <button
        onClick={onSubmit}
        disabled={!url || isLoading}
        className="absolute right-2 top-2 bottom-2 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] 
                   px-6 rounded-[var(--radius-md)] font-medium
                   hover:bg-[var(--color-accent-primary)] hover:text-white
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-text-primary)]
                   transition-all duration-300 flex items-center gap-2 group-hover:shadow-md"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <>
            <span>Read</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </div>
  )
}

export default UrlInput
