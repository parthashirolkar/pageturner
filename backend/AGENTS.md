# AGENTS.md - Backend Agent Guidelines

Guidelines for agentic coding agents working on this backend.

## Build & Test Commands

### Setup
```bash
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### Run Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Type Checking
```bash
# Activate venv first!
source .venv/bin/activate
pyright app/                    # Check entire app
pyright app/services/file.py    # Check specific file
```

### Testing
```bash
# pytest not configured yet - add tests using pytest
# Run single test: pytest tests/test_file.py::test_name -v
```

### Docker
```bash
docker build -t qwen-tts-api .
docker run -p 8000:8000 --gpus all qwen-tts-api
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes.py           # API endpoints (POST /tts, GET /status/{id}, GET /download/{id})
│   ├── core/
│   │   ├── config.py           # Pydantic settings from .env
│   │   ├── exceptions.py       # Custom exceptions (TTSException base)
│   │   └── model.py            # Qwen3TTS model manager with lifespan loading
│   ├── models/
│   │   └── job.py              # Pydantic models for job API (TTSJobCreate, TTSJobResponse, TTSJobStatus)
│   ├── services/
│   │   ├── audio_processor.py  # Audio file handling (save, format conversion)
│   │   ├── content_extractor.py# Trafilatura-based blog content extraction
│   │   ├── job_store.py        # Redis-backed job state storage with TTL
│   │   └── tts_processor.py    # Background task processor for async TTS generation
│   └── main.py                 # FastAPI app with CORS and lifespan
├── .venv/                       # Virtual environment
├── .env                         # Environment variables (REDIS_URL required)
└── requirements.txt             # Python dependencies
```

## Code Style Guidelines

### Import Order
Standard library → Third-party → Local (separated by blank lines):
```python
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.models.job import TTSJobCreate
```

### Type Hints
Required for all functions. Use `typing` module and Pydantic `Field()`:
```python
async def process_url(self, url: str) -> dict[str, str]:
    ...
```

### Async/Await
All service methods and endpoints must be async:
```python
async def generate_audio(job_id: str, text: str) -> None:
    ...
```

### Logging
```python
logger = logging.getLogger(__name__)
logger.info(f"Processing job {job_id}")
logger.error(f"Job failed: {error}")
```

### Exception Handling
Custom exceptions in `app/core/exceptions.py` inheriting from `TTSException`:
```python
raise ContentExtractionException(f"Failed to extract from {url}")
```

### Configuration
Use Pydantic `BaseSettings` - access via `settings` instance, not `os.environ`.

### API Routes
- Use `APIRouter` with Pydantic models
- `BackgroundTasks` for async work (returns job_id immediately)
- `BackgroundTask` for cleanup (file deletion after download)

## Async/Polling Pattern

This backend uses an async/polling architecture for long-running TTS generation:

**Flow:**
1. Client POSTs to `/tts` with URL → receives `{job_id, status: "pending"}`
2. Background task generates audio (may take 30-60 seconds)
3. Client polls `/status/{job_id}` → receives job status updates
4. When `status: "completed"`, response includes `audio_id`
5. Client downloads via `/download/{audio_id}` (auto-deletes after)

**Job States:** `pending` → `processing` → `completed`/`failed`

**Redis Storage:** Jobs stored in Redis with 1-hour TTL (auto-cleanup)

**Files Created:**
- `app/services/job_store.py` - Redis job state management
- `app/services/tts_processor.py` - Background TTS generation
- `app/models/job.py` - Job-related Pydantic models

## Tech Stack

- **Framework**: FastAPI
- **Python**: 3.10+ (configured for 3.13)
- **Type Checking**: Pyright (install via `uv pip install pyright`)
- **TTS**: Qwen3-TTS 0.6B with custom voice
- **Content Extraction**: Trafilatura
- **Audio**: soundfile, pydub, numpy
- **HTTP Client**: httpx
- **Job Queue**: Redis (5.0.1) - requires `REDIS_URL` in .env

## Important Notes

- GPU required (CUDA 12.1+, 4-6GB VRAM)
- Redis must be running: `redis://localhost:6379/0` in .env
- Model loaded once on startup via lifespan context manager
- Jobs auto-expire from Redis after 1 hour
- Temp audio files deleted after download via BackgroundTask
- No authentication - add before production deployment
