# PageTurner

**Listen to the Web** — Transform any article into a narrated audio experience using AI-powered text-to-speech.

PageTurner extracts content from any URL, summarizes it with an LLM, and generates natural-sounding audio narration using Qwen3-TTS. Built with a FastAPI backend and React frontend.

## Architecture

```
┌─────────────────┐       ┌──────────────────────────────────────┐
│   React + Vite  │       │           FastAPI Backend            │
│   (port 3000)   │──────▶│           (port 8000)                │
│                 │  HTTP │                                      │
│  URL Input      │       │  POST /tts ─▶ Background Job         │
│  Status Polling │◀──────│  GET /status/{id} ─▶ Redis Lookup    │
│  Audio Player   │       │  GET /download/{id} ─▶ File Stream   │
└─────────────────┘       │                                      │
                          │  Pipeline:                           │
                          │  URL → Extract → Summarize → TTS     │
                          │       (trafilatura) (LLM)  (Qwen3)   │
                          │                                      │
                          │  Storage: Redis (job state)           │
                          │  Audio:   /tmp/tts_output (temp MP3s) │
                          └──────────────────────────────────────┘
```

## Features

- 🔗 Paste any article URL and get a narrated audio version
- 📝 Automatic content extraction via [Trafilatura](https://trafilatura.readthedocs.io/)
- 🤖 LLM-powered summarization (OpenRouter / any OpenAI-compatible API)
- 🗣️ High-quality TTS with [Qwen3-TTS](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice) custom narrator voice
- ⚡ Async job processing — non-blocking polling with real-time status updates
- 🎧 Built-in audio player with playback controls
- 🌗 Light / dark theme with localStorage persistence

## Prerequisites

| Dependency | Version       | Notes                               |
| ---------- | ------------- | ----------------------------------- |
| Python     | 3.10+         | 3.13 recommended                    |
| Node / Bun | Bun preferred | Runtime for frontend                |
| Redis      | 5.0+          | Job state storage                   |
| CUDA       | 12.1+         | GPU inference (4-6 GB VRAM)         |
| GPU        | Ampere/Ada+   | RTX 3090/4060+, A100+ for FlashAttn |
| uv         | latest        | Python package manager              |

## Quick Start

### 1. Backend

```bash
cd backend

# Create .env
cat > .env << 'EOF'
REDIS_URL=redis://localhost:6379/0
BASE_URL=https://openrouter.ai/api/v1    # or any OpenAI-compatible endpoint
API_KEY=your-api-key-here
EOF

# Install deps and run
uv venv .venv && source .venv/bin/activate
uv pip install -r requirements.txt
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend

```bash
cd frontend

# Create .env.local
echo 'VITE_API_URL=http://localhost:8000' > .env.local

# Install deps and run
bun install
bun dev
```

### 3. Redis

Make sure Redis is running on `localhost:6379`. Examples:

```bash
# System service
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine

# WSL — install & start
sudo apt install redis-server && sudo service redis-server start
```

Open [http://localhost:3000](http://localhost:3000) and paste an article URL.

## API Endpoints

| Method | Endpoint               | Description                                                        |
| ------ | ---------------------- | ------------------------------------------------------------------ |
| `POST` | `/tts`                 | Submit a URL for TTS conversion. Returns `job_id`.                 |
| `GET`  | `/status/{job_id}`     | Poll job status (`pending` → `processing` → `completed`/`failed`). |
| `GET`  | `/download/{audio_id}` | Download the generated MP3 audio file.                             |
| `GET`  | `/health`              | Health check.                                                      |

### Example

```bash
# Submit
curl -X POST http://localhost:8000/tts \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/blog-post"}'

# Poll (use the job_id from above)
curl http://localhost:8000/status/{job_id}

# Download (use the audio_id from completed status)
curl -o audio.mp3 http://localhost:8000/download/{audio_id}
```

## Project Structure

```
pageturner/
├── backend/
│   ├── app/
│   │   ├── api/routes.py              # FastAPI endpoints
│   │   ├── core/
│   │   │   ├── config.py              # Pydantic settings
│   │   │   ├── model.py               # Qwen3-TTS model manager
│   │   │   └── exceptions.py          # Custom exceptions
│   │   ├── models/job.py              # Request/response schemas
│   │   ├── services/
│   │   │   ├── content_extractor.py   # URL fetch + extract + summarize
│   │   │   ├── tts_processor.py       # Background TTS job runner
│   │   │   ├── audio_processor.py     # Audio encoding & file mgmt
│   │   │   └── job_store.py           # Redis job state
│   │   └── main.py                    # App entrypoint + CORS
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/                       # Axios client & API calls
│   │   ├── components/                # UI components
│   │   ├── hooks/                     # useTts, useTheme
│   │   ├── types/                     # TypeScript interfaces
│   │   └── App.tsx
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## Tech Stack

**Backend**: FastAPI · Python 3.13 · Qwen3-TTS · FlashAttention-2 · Trafilatura · Redis · Pydantic · soundfile/pydub

**Frontend**: React 19 · Vite 7 · TypeScript 5.9 · Tailwind CSS 4 · Axios · lucide-react

## Configuration

All backend config is via environment variables (`.env`):

| Variable              | Default                                | Description                                        |
| --------------------- | -------------------------------------- | -------------------------------------------------- |
| `REDIS_URL`           | —                                      | Redis connection string (required)                 |
| `BASE_URL`            | —                                      | OpenAI-compatible API base URL (for summarization) |
| `API_KEY`             | —                                      | API key for the summarization endpoint             |
| `TTS_MODEL`           | `Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice` | HuggingFace model ID                               |
| `TTS_SPEAKER`         | `Ryan`                                 | Voice speaker name                                 |
| `GPU_DEVICE`          | `cuda:0`                               | GPU device                                         |
| `AUDIO_FORMAT`        | `mp3`                                  | Output format (`mp3` or `wav`)                     |
| `MAX_TEXT_LENGTH`     | `100000`                               | Character limit for input text                     |
| `CACHE_TTL`           | `3600`                                 | Job expiry in Redis (seconds)                      |
| `ATTN_IMPLEMENTATION` | `flash_attention_2`                    | Attention backend (`flash_attention_2` or `sdpa`)  |

## License

MIT
