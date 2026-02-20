# Qwen3-TTS Blog-to-Speech API

FastAPI backend for converting blog posts to audio using Qwen3-TTS 0.6B model.

## Features

- Converts blog URLs to high-quality audio (MP3)
- Custom narrator voice (calm, clear, professional)
- GPU-optimized for fast inference
- Automatic content extraction from HTML
- Exception handling throughout the pipeline

## Quick Start

### Local Development

1. **Install dependencies**:
```bash
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

2. **Run the server**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. **Test the API**:
```bash
curl -X POST "http://localhost:8000/tts" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/blog-post"}'
```

## API Endpoints

### POST /tts
Convert a blog URL to audio.

**Request**:
```json
{
  "url": "https://example.com/blog-post"
}
```

**Response**:
```json
{
  "audio_id": "uuid",
  "status": "success",
  "text_length": 1234,
  "estimated_duration": 45.2,
  "title": "Blog Title",
  "message": "Audio generated successfully"
}
```

### GET /download/{audio_id}
Download generated audio file.

**Response**: MP3 audio file

### GET /health
Health check endpoint.

## Configuration

Environment variables (create `.env`):

```bash
TTS_MODEL=Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice
TTS_SPEAKER=Ryan
TTS_LANGUAGE=English
GPU_DEVICE=cuda:0
USE_GPU=true
AUDIO_FORMAT=mp3
HTTP_TIMEOUT=30.0
```

## Docker Deployment

```bash
docker build -t qwen-tts-api .
docker run --gpus all -p 8000:8000 qwen-tts-api
```

## Requirements

- Python 3.10+
- CUDA 12.1+ (for GPU support)
- 4-6 GB VRAM
