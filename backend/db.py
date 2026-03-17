from datetime import datetime
from pathlib import Path
import pickle
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel

from models.patients import Patient


class InMemoryPatientDB:
    def __init__(self, storage_path: Path | None = None) -> None:
        self._patients: dict[int, Patient] = {}
        self.id_counter = 1
        self.storage_path = storage_path or Path(__file__).resolve().parent.parent / "patient_db.pkl"
        self._load_from_disk()

    def _load_from_disk(self) -> None:
        if not self.storage_path.exists():
            return

        try:
            with self.storage_path.open("rb") as persisted_file:
                payload = pickle.load(persisted_file)
        except Exception:
            # If the pickle is invalid/corrupt, fall back to an empty in-memory state.
            return

        if not isinstance(payload, dict):
            return

        patients = payload.get("patients")
        id_counter = payload.get("id_counter")
        if not isinstance(patients, dict):
            return

        normalized_patients: dict[int, Patient] = {}
        for key, value in patients.items():
            if not isinstance(key, int):
                continue
            if isinstance(value, Patient):
                normalized_patients[key] = value

        self._patients = normalized_patients
        if isinstance(id_counter, int) and id_counter > 0:
            self.id_counter = id_counter
        elif normalized_patients:
            self.id_counter = max(normalized_patients.keys()) + 1

    def _persist_to_disk(self) -> None:
        payload = {
            "id_counter": self.id_counter,
            "patients": self._patients,
        }
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self.storage_path.with_suffix(".tmp")
        with temp_path.open("wb") as temp_file:
            pickle.dump(payload, temp_file)
        temp_path.replace(self.storage_path)

    def get_id(self) -> int:
        current_id = self.id_counter
        self.id_counter += 1
        return current_id

    async def save(self, patient: Patient) -> None:
        self._patients[patient.id] = patient
        self._persist_to_disk()

    async def get(self, patient_id: int) -> Patient | None:
        return self._patients.get(patient_id)

    async def get_all(self) -> list[Patient]:
        return list(self._patients.values())


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
