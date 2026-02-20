# AGENTS.md - Frontend Agent Guidelines

Guidelines for agentic coding agents working on this frontend.

## Build & Test Commands

### Setup
```bash
cd frontend
bun install
```

### Type Checking
```bash
bunx tsc --noEmit    # Type check without emitting files
```
- While developing, dont ignore the LSP errors that the TypeScript compiler throws. Address them immediately if they can be addressed at that point, or acknowledge them and work on them later.

### Testing
No test framework configured yet - add Vitest or similar when needed.

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts           # Axios instance with error handling
│   │   └── tts.ts              # TTS API endpoints
│   ├── components/
│   │   ├── Header.tsx          # App header with theme toggle
│   │   ├── UrlInput.tsx        # URL input form
│   │   ├── GenerationStatus.tsx# Polling status display
│   │   ├── AudioPlayer.tsx     # Audio playback controls
│   │   └── ErrorDisplay.tsx    # Error messages with retry
│   ├── hooks/
│   │   ├── useTheme.tsx        # Theme context provider
│   │   └── useTts.ts           # TTS mutation + polling hook
│   ├── types/
│   │   └── api.ts              # TypeScript interfaces
│   ├── App.tsx                 # Main app component
│   └── main.tsx                # React entry point
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite config
└── tsconfig.json               # TypeScript config (strict mode)
```

## Code Style Guidelines

### Import Order
React → Third-party → Local (separated by blank lines):
```tsx
import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { useTheme } from './hooks/useTheme'
```

### Component Declaration
Use named function components (not arrow functions with FC), direct exports:
```tsx
function Header() {
  return <header>...</header>
}

export default Header
```

### Type Annotations
- Props: Define interfaces inline for simple props, separate files for shared types
- API types: Export interfaces from `src/types/api.ts`
- ReactNode: Use for children props
- Custom hooks: Return typed objects

### Context Pattern
```tsx
const Context = createContext<ContextType | undefined>(undefined)

export const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ...
}

export const useHook = () => {
  const context = useContext(Context)
  if (context === undefined) throw new Error('useHook must be used within Provider')
  return context
}
```

### CSS Classes
- Tailwind utility classes for layout, spacing, colors
- Custom CSS variables for theming: `--color-text-primary`, `--color-accent-primary`, etc.
- Animation classes: `animate-slide-up`, `animate-fade-in`
- Custom class: `container-custom` (max-width container)

### Error Handling
```tsx
// API errors
try {
  // ...
} catch (error) {
  const message = handleApiError(error as AxiosError)
  setError(message)
}

// Display errors conditionally
{error && <ErrorDisplay error={error} onRetry={handleRetry} />}
```

### State Management
- Local state: useState for component state
- Global state: React Context (useTheme)
- Server state: Custom hooks with polling (useTts)
- localStorage: Persist user preferences (theme)

### Async/Polling Pattern
The app polls the backend for long-running TTS generation:
1. POST /tts → returns {job_id, status: "pending"}
2. Poll GET /status/{job_id} every 2s until status: "completed"
3. GET /download/{audio_id} for audio blob

## Tech Stack

- **Framework**: React 19 with Vite 7.3
- **Language**: TypeScript 5.9 (strict mode)
- **Runtime**: Bun (preferred over Node)
- **Styling**: Tailwind CSS 4.1 (via Vite plugin)
- **HTTP**: Axios
- **Icons**: lucide-react
- **Fonts**: @fontsource/fraunces, @fontsource/outfit
- **Path Aliases**: @/* → src/*

## Environment Variables

Create `.env.local` in `frontend/`:
```bash
VITE_API_URL=http://localhost:8000
```

## Backend Integration

The frontend connects to a FastAPI backend:
- Base URL: `VITE_API_URL` (default: http://localhost:8000)
- Endpoints: POST /tts, GET /status/{id}, GET /download/{id}
- Async polling pattern with 2s intervals
- Audio blobs created via URL.createObjectURL()

## Implementation Notes

**What's Been Implemented:**
- Theme switching (light/dark) with localStorage persistence
- URL input and validation
- TTS job submission and status polling
- Audio player with progress tracking
- Error handling with retry functionality
- Responsive layout with animations
- Loading states during generation and audio fetching

**To Add:**
- Test framework (Vitest recommended)
- ESLint/Prettier config
- Accessibility improvements
- Error boundary component
