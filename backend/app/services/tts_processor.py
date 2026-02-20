import asyncio
import logging

from app.core.config import settings
from app.core.exceptions import TTSException
from app.core.model import model_manager
from app.services.audio_processor import AudioProcessor
from app.services.content_extractor import ContentExtractor
from app.services.job_store import JobStore, JobStatus

logger = logging.getLogger(__name__)


class TTSProcessor:
    def __init__(self, job_store: JobStore):
        self.job_store = job_store
        self.audio_processor = AudioProcessor()
        self.content_extractor = ContentExtractor()

    async def process_tts_job(self, job_id: str, url: str):
        logger.info(f"Processing TTS job {job_id} for URL: {url}")

        try:
            self.job_store.update_job(job_id, JobStatus.PROCESSING)

            content = await self.content_extractor.process_url(url)
            text = content["text"]

            if len(text) > settings.MAX_TEXT_LENGTH:
                raise TTSException(
                    f"Text too long: {len(text)} characters (max: {settings.MAX_TEXT_LENGTH})"
                )

            logger.info(f"Generating audio for {len(text.split())} words")

            # Run CPU-bound TTS inference in a thread to avoid blocking the event loop
            wavs, sr = await asyncio.to_thread(model_manager.generate, text)
            combined_audio = (wavs[0], sr)

            audio_id = self.audio_processor.generate_audio_id()
            output_path = self.audio_processor.get_temp_path(
                audio_id, settings.AUDIO_FORMAT
            )

            # Run audio encoding in a thread to avoid blocking the event loop
            await asyncio.to_thread(
                self.audio_processor.save_audio,
                combined_audio,
                output_path,
                settings.AUDIO_FORMAT,
            )

            duration = self.audio_processor.get_duration(combined_audio)

            logger.info(
                f"Audio generated successfully for job {job_id}, duration: {duration:.2f}s"
            )

            self.job_store.update_job(
                job_id,
                JobStatus.COMPLETED,
                audio_id=audio_id,
                duration=duration,
                text_length=len(text),
                title=content.get("title"),
            )

        except TTSException as e:
            logger.error(f"TTS processing failed for job {job_id}: {e}")
            self.job_store.update_job(job_id, JobStatus.FAILED, error=str(e))
        except Exception as e:
            logger.error(f"Unexpected error processing job {job_id}: {e}")
            self.job_store.update_job(
                job_id, JobStatus.FAILED, error=f"Internal server error: {str(e)}"
            )


tts_processor = TTSProcessor
