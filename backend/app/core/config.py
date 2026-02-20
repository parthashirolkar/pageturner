import os
import logging
from typing import Optional

from pydantic_settings import BaseSettings
from pydantic import field_validator

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    APP_NAME: str = "Qwen3-TTS Blog-to-Speech API"
    VERSION: str = "1.0.0"

    TTS_MODEL: str = "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice"
    TTS_SPEAKER: str = "Ryan"
    TTS_LANGUAGE: str = "English"
    TTS_INSTRUCTION: str = "Speak in a calm, clear, professional narrator voice suitable for audiobooks and long-form content. Maintain a steady pace and neutral British east midlands accent."

    GPU_DEVICE: str = "cuda:0"
    USE_GPU: bool = True
    DTYPE: str = "bfloat16"
    ATTN_IMPLEMENTATION: str = "flash_attention_2"

    @field_validator("ATTN_IMPLEMENTATION", mode="before")
    @classmethod
    def validate_attn_implementation(cls, v: str) -> str:
        valid_options = ["flash_attention_2", "sdpa", "eager"]
        if v not in valid_options:
            raise ValueError(f"ATTN_IMPLEMENTATION must be one of {valid_options}")

        # If flash_attn is requested but not available, fall back to sdpa
        if v == "flash_attention_2":
            try:
                import flash_attn  # noqa: F401
            except ImportError:
                logger.warning(
                    "flash_attn not installed, falling back to 'sdpa'. "
                    "Install flash-attn or set ATTN_IMPLEMENTATION=sdpa in .env"
                )
                return "sdpa"
        return v

    TEMP_AUDIO_DIR: str = "/tmp/tts_output"
    AUDIO_FORMAT: str = "mp3"

    REDIS_URL: Optional[str] = None
    CACHE_TTL: int = 3600
    DOWNLOAD_RETRY_TTL: int = 300

    HTTP_TIMEOUT: float = 30.0
    MAX_TEXT_LENGTH: int = 100000

    OPENAI_API_BASE_URL: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    BASE_URL: Optional[str] = None
    API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()

os.makedirs(settings.TEMP_AUDIO_DIR, exist_ok=True)
