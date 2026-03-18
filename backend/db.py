from datetime import datetime
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel

class ExtractionJob(BaseModel):
    job_id: str
    patient_id: int
    consultation_id: str
    status: Literal["queued", "processing", "completed", "failed"]
    created_at: datetime
    updated_at: datetime
    error: str | None = None
    result: dict[str, object] | None = None


class InMemoryJobQueue:
    def __init__(self) -> None:
        self._jobs: dict[str, ExtractionJob] = {}

    async def create_job(self, patient_id: int, consultation_id: str) -> ExtractionJob:
        now = datetime.utcnow()
        job = ExtractionJob(
            job_id=str(uuid4()),
            patient_id=patient_id,
            consultation_id=consultation_id,
            status="queued",
            created_at=now,
            updated_at=now,
        )
        self._jobs[job.job_id] = job
        return job

    async def get_job(self, job_id: str) -> ExtractionJob | None:
        return self._jobs.get(job_id)

    async def list_jobs(self) -> list[ExtractionJob]:
        return list(self._jobs.values())

    async def get_jobs_for_patient(self, patient_id: int) -> list[ExtractionJob]:
        return [job for job in self._jobs.values() if job.patient_id == patient_id]

    async def update_status(
        self,
        job_id: str,
        status: Literal["queued", "processing", "completed", "failed"],
        error: str | None = None
    ) -> ExtractionJob | None:
        job = self._jobs.get(job_id)
        if job is None:
            return None

        job.status = status
        job.updated_at = datetime.utcnow()
        if error is not None:
            job.error = error
        self._jobs[job_id] = job
        return job
