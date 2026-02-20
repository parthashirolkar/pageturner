import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.config import settings
from app.core.exceptions import TTSException
from app.core.model import model_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")

    import os

    base_url = os.getenv("BASE_URL")
    api_key = os.getenv("API_KEY")

    if base_url:
        logger.info(f"✓ BASE_URL loaded: {base_url[:30]}...")
    else:
        logger.warning("✗ BASE_URL not found in environment!")

    if api_key:
        logger.info(f"✓ API_KEY loaded: {api_key[:20]}...")
    else:
        logger.warning("✗ API_KEY not found in environment!")

    logger.info(f"Loading TTS model: {settings.TTS_MODEL}")
    model_manager.load_model()
    logger.info("Model loaded successfully!")
    yield
    logger.info("Shutting down...")


app = FastAPI(title=settings.APP_NAME, version=settings.VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": settings.TTS_MODEL}


@app.exception_handler(TTSException)
async def tts_exception_handler(request, exc: TTSException):
    logger.error(f"TTS Exception: {exc}")
    return JSONResponse(status_code=400, content={"success": False, "error": str(exc)})


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500, content={"success": False, "error": "Internal server error"}
    )
