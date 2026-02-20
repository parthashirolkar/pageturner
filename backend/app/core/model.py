import torch
from qwen_tts import Qwen3TTSModel
from typing import Optional, Tuple, List
import logging
import asyncio

from app.core.config import settings
from app.core.exceptions import ModelInferenceException

logger = logging.getLogger(__name__)


class TTSModelManager:
    _instance: Optional["TTSModelManager"] = None
    model: Optional[Qwen3TTSModel] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self):
        if self.model is not None:
            return self.model

        try:
            logger.info(f"Loading TTS model: {settings.TTS_MODEL}")

            device = (
                settings.GPU_DEVICE
                if settings.USE_GPU and torch.cuda.is_available()
                else "cpu"
            )
            dtype = (
                torch.bfloat16
                if settings.USE_GPU and torch.cuda.is_available()
                else torch.float32
            )

            attn_implementation = "sdpa" if settings.USE_GPU else "eager"
            logger.info(
                f"Using device: {device}, dtype: {dtype}, attention: {attn_implementation}"
            )

            self.model = Qwen3TTSModel.from_pretrained(
                settings.TTS_MODEL,
                device_map=device if settings.USE_GPU else None,
                dtype=dtype,
                attn_implementation=attn_implementation,
            )

            if settings.USE_GPU and torch.cuda.is_available():
                logger.info("Applying GPU optimizations...")
                torch.backends.cuda.matmul.allow_tf32 = True
                torch.backends.cudnn.allow_tf32 = True
                torch.backends.cudnn.benchmark = True
                logger.info("TF32 and cuDNN optimizations enabled")

            logger.info("Model loaded successfully")
            return self.model

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise ModelInferenceException(f"Failed to load TTS model: {str(e)}")

    def generate(self, text: str) -> Tuple:
        if self.model is None:
            self.model = self.load_model()

        try:
            result = self.model.generate_custom_voice(
                text=text,
                language=settings.TTS_LANGUAGE,
                speaker=settings.TTS_SPEAKER,
                instruction=settings.TTS_INSTRUCTION,
            )
            return result
        except Exception as e:
            logger.error(f"TTS generation failed: {e}")
            raise ModelInferenceException(f"TTS generation failed: {str(e)}")

    async def batch_generate(self, chunks: List[str]) -> List[Tuple]:
        if self.model is None:
            self.model = self.load_model()

        model = self.model
        assert model is not None, "Model should be loaded"

        try:
            logger.info(f"Processing {len(chunks)} chunks in parallel...")

            async def process_chunk(chunk: str, index: int) -> Tuple[int, Tuple]:
                result = model.generate_custom_voice(
                    text=chunk,
                    language=settings.TTS_LANGUAGE,
                    speaker=settings.TTS_SPEAKER,
                    instruction=settings.TTS_INSTRUCTION,
                )
                logger.info(f"Chunk {index + 1}/{len(chunks)} completed")
                return (index, result)

            tasks = [process_chunk(chunk, i) for i, chunk in enumerate(chunks)]
            results = await asyncio.gather(*tasks)

            sorted_results = [r[1] for r in sorted(results, key=lambda x: x[0])]
            return sorted_results

        except Exception as e:
            logger.error(f"Batch TTS generation failed: {e}")
            raise ModelInferenceException(f"Batch TTS generation failed: {str(e)}")


model_manager = TTSModelManager()
