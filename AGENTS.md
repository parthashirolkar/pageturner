# Agent Guidelines for PageTurner

## Project Overview

PageTurner is a web application that converts blog posts to audio using text-to-speech. Backend runs FastAPI (Python 3.12+) with Qwen3-TTS for audio generation; frontend uses React 19 + Vite with TypeScript and Tailwind CSS 4.

### Frontend (React + Vite)

```bash
cd frontend
bun run lint         # Run ESLint to check code quality
bun run typecheck    # Run TypeScript compiler type checking
```

### Backend (FastAPI)

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

- **Never** run the above python command. Assume user is running it already in a separate terminal.

#### Type Hints

- Type all function parameters and return values
- Use Pydantic models with Field() descriptions for API schemas
- Place models in `app/models/`, services in `app/services/`

#### Service Layer

- Business logic goes in `app/services/`
- Use dependency injection for services (pass job_store, processors to constructors)
- Keep route handlers thin—delegate to services

### Frontend

- **Preferred runtime**: Bun
- Use `bun <file>`
- Use `bun install`

### Backend

- **Preferred python package manager**: uv
- GPU inference uses FlashAttention-2 for acceleration
- Default audio format: MP3
- Text length limit enforced via MAX_TEXT_LENGTH
- Redis for job state persistence (optional)
