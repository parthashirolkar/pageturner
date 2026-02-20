import React from 'react'
import { useTheme } from '../hooks/useTheme'
import { Sun, Moon, Sparkles } from 'lucide-react'

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--color-bg-primary)]/80 border-b border-[var(--color-bg-tertiary)] transition-colors duration-300">
      <div className="container-custom h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center text-[var(--color-bg-primary)] transform group-hover:rotate-12 transition-transform duration-500">
            <Sparkles size={18} fill="currentColor" />
          </div>
          <span className="font-heading text-2xl tracking-tight text-[var(--color-text-primary)]">
            PageTurner
          </span>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-full hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] transition-all duration-300 transform hover:scale-105 active:scale-95"
          aria-label="Toggle theme"
        >
          <div className="relative w-6 h-6">
            <span className={`absolute inset-0 transform transition-all duration-500 ${theme === 'dark' ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`}>
              <Sun size={24} />
            </span>
            <span className={`absolute inset-0 transform transition-all duration-500 ${theme === 'light' ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'}`}>
              <Moon size={24} />
            </span>
          </div>
        </button>

      </div>
    </header>
  )
}

export default Header
