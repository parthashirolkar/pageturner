from typing import Optional

from pydantic import BaseModel, Field, HttpUrl

from app.services.job_store import JobStatus


class TTSJobCreate(BaseModel):
    url: HttpUrl = Field(..., description="URL of the blog post to convert")


class TTSJobResponse(BaseModel):
    job_id: str = Field(..., description="Unique job identifier")
    status: JobStatus = Field(..., description="Current job status")
    message: str = Field(..., description="Status message")
    created_at: str = Field(..., description="Job creation timestamp")


class TTSJobStatus(BaseModel):
    job_id: str = Field(..., description="Unique job identifier")
    status: JobStatus = Field(..., description="Current job status")
    audio_id: Optional[str] = Field(None, description="Audio file ID when complete")
    error: Optional[str] = Field(None, description="Error message if failed")
    title: Optional[str] = Field(None, description="Content title")
    url: str = Field(..., description="Source URL")
    created_at: str = Field(..., description="Job creation timestamp")
    completed_at: Optional[str] = Field(None, description="Job completion timestamp")
    estimated_duration: Optional[float] = Field(
        None, description="Audio duration in seconds"
    )
    text_length: Optional[int] = Field(None, description="Length of processed text")
