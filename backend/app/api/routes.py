import asyncio
import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse

from app.core.config import settings
from app.models.job import TTSJobCreate, TTSJobResponse, TTSJobStatus
from app.services.audio_processor import AudioProcessor
from app.services.job_store import JobStore, JobStatus
from app.services.tts_processor import TTSProcessor

logger = logging.getLogger(__name__)

router = APIRouter()
job_store = JobStore()


async def delayed_file_cleanup(file_path: str, delay_seconds: int):
    await asyncio.sleep(delay_seconds)
    audio_processor = AudioProcessor()
    audio_id = file_path.split("/")[-1].split(".")[0]
    audio_processor.delete_file(audio_id, settings.AUDIO_FORMAT)
    logger.info(f"Deleted file {file_path} after {delay_seconds} second delay")


@router.post("/tts", response_model=TTSJobResponse)
async def convert_url_to_speech(
    request: TTSJobCreate, background_tasks: BackgroundTasks
):
    job_id = str(uuid.uuid4())
    url = str(request.url)

    logger.info(f"Creating TTS job {job_id} for URL: {url}")

    try:
        job = job_store.create_job(job_id, url)

        processor = TTSProcessor(job_store)
        background_tasks.add_task(processor.process_tts_job, job_id, url)

        return TTSJobResponse(
            job_id=job_id,
            status=JobStatus.PENDING,
            message="Job created successfully. Use /status/ endpoint to check progress.",
            created_at=job["created_at"],
        )

    except Exception as e:
        logger.error(f"Failed to create job: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")


@router.get("/status/{job_id}", response_model=TTSJobStatus)
async def get_job_status(job_id: str):
    job = job_store.get_job(job_id)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return TTSJobStatus(
        job_id=job["job_id"],
        status=JobStatus(job["status"]),
        audio_id=job.get("audio_id"),
        error=job.get("error"),
        title=job.get("title"),
        url=job["url"],
        created_at=job["created_at"],
        completed_at=job.get("completed_at"),
        estimated_duration=job.get("duration"),
        text_length=job.get("text_length"),
    )


@router.get("/download/{audio_id}")
async def download_audio(audio_id: str, background_tasks: BackgroundTasks):
    audio_processor = AudioProcessor()

    if not audio_processor.file_exists(audio_id, settings.AUDIO_FORMAT):
        raise HTTPException(status_code=404, detail="Audio file not found")

    file_path = audio_processor.get_temp_path(audio_id, settings.AUDIO_FORMAT)

    background_tasks.add_task(
        delayed_file_cleanup, file_path, settings.DOWNLOAD_RETRY_TTL
    )

    return FileResponse(
        path=file_path,
        media_type=f"audio/{settings.AUDIO_FORMAT}",
        filename=f"{audio_id}.{settings.AUDIO_FORMAT}",
    )
