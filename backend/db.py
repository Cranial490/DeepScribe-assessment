from datetime import datetime
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel

from models.patients import Patient


class InMemoryPatientDB:
    def __init__(self) -> None:
        self._patients: dict[str, Patient] = {}
        self.id_counter = 1

    def get_id(self) -> int:
        current_id = self.id_counter
        self.id_counter += 1
        return current_id
        
    async def save(self, patient: Patient) -> None:
        self._patients[patient.id] = patient

    async def get(self, patient_id: str) -> Patient | None:
        return self._patients.get(patient_id)

    async def get_all(self) -> list[Patient]:
        return list(self._patients.values())


class ExtractionJob(BaseModel):
    job_id: str
    patient_id: str
    consultation_id: str
    status: Literal["queued", "processing", "completed", "failed"]
    created_at: datetime
    updated_at: datetime
    error: str | None = None
    result: dict[str, object] | None = None


class InMemoryJobQueue:
    def __init__(self) -> None:
        self._jobs: dict[str, ExtractionJob] = {}

    async def create_job(self, patient_id: str, consultation_id: str) -> ExtractionJob:
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

    async def get_jobs_for_patient(self, patient_id: str) -> list[ExtractionJob]:
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
