import json
import logging
from datetime import datetime
from enum import Enum
from typing import Optional, Any

import redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobStore:
    def __init__(self):
        self.redis_client: Any = None
        if settings.REDIS_URL:
            self.redis_client = redis.from_url(
                settings.REDIS_URL, decode_responses=True
            )
            logger.info(f"Connected to Redis at {settings.REDIS_URL}")
        else:
            raise ValueError("REDIS_URL must be configured for job storage")

    def create_job(self, job_id: str, url: str, title: Optional[str] = None) -> dict:
        job_data = {
            "job_id": job_id,
            "url": url,
            "title": title,
            "status": JobStatus.PENDING.value,
            "audio_id": None,
            "error": None,
            "created_at": datetime.utcnow().isoformat(),
            "completed_at": None,
        }

        self.redis_client.setex(
            f"job:{job_id}", settings.CACHE_TTL, json.dumps(job_data)
        )

        logger.info(f"Created job {job_id} for URL: {url}")
        return job_data

    def update_job(
        self,
        job_id: str,
        status: JobStatus,
        audio_id: Optional[str] = None,
        error: Optional[str] = None,
        duration: Optional[float] = None,
        text_length: Optional[int] = None,
        title: Optional[str] = None,
    ) -> Optional[dict]:
        job_data = self.get_job(job_id)
        if not job_data:
            logger.error(f"Job {job_id} not found")
            return None

        job_data["status"] = status.value

        if audio_id:
            job_data["audio_id"] = audio_id

        if error:
            job_data["error"] = error

        if duration is not None:
            job_data["duration"] = duration

        if text_length is not None:
            job_data["text_length"] = text_length

        if title is not None:
            job_data["title"] = title

        if status in [JobStatus.COMPLETED, JobStatus.FAILED]:
            job_data["completed_at"] = datetime.utcnow().isoformat()

        self.redis_client.setex(
            f"job:{job_id}", settings.CACHE_TTL, json.dumps(job_data)
        )

        logger.info(f"Updated job {job_id} to status: {status}")
        return job_data

    def get_job(self, job_id: str) -> Optional[dict]:
        data = self.redis_client.get(f"job:{job_id}")
        if data:
            return json.loads(data)
        return None

    def delete_job(self, job_id: str) -> bool:
        result = self.redis_client.delete(f"job:{job_id}")
        if result:
            logger.info(f"Deleted job {job_id}")
        return result > 0

    def job_exists(self, job_id: str) -> bool:
        return self.redis_client.exists(f"job:{job_id}") > 0


job_store = JobStore()
