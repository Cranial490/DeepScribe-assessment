import os
from dotenv import load_dotenv
from models.patients import LLMExtracted
from utils.extraction_module.llm_extraction import LLMExtractionService
from utils.openai_llm import Openai_llm
load_dotenv()

class ExtractionJobRunner:
    def __init__(self, app) -> None:
        self.app = app
        self.job_queue = app.state.job_queue
        self.patient_db = app.state.patient_db

    async def set_consultation_extraction_status(
        self,
        patient_id: str,
        consultation_id: str,
        status_value: str,
    ) -> None:
        patient = await self.patient_db.get(patient_id)
        if patient is None:
            return
        consultation = patient.consultation_records.get(consultation_id)
        if consultation is None:
            return
        consultation.llm_extracted = LLMExtracted(status=status_value)
        patient.consultation_records[consultation_id] = consultation
        await self.patient_db.save(patient)

    async def run(
        self,
        job_id: str,
        patient_id: str,
        consultation_id: str,
    ) -> None:
        await self.job_queue.update_status(job_id=job_id, status="processing")
        await self.set_consultation_extraction_status(
            patient_id=patient_id,
            consultation_id=consultation_id,
            status_value="processing",
        )

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            await self.job_queue.update_status(
                job_id=job_id,
                status="failed",
                error="OPENAI_API_KEY is not configured.",
            )
            await self.set_consultation_extraction_status(
                patient_id=patient_id,
                consultation_id=consultation_id,
                status_value="failed",
            )
            return

        llm = Openai_llm(llm_api_key=api_key)
        extraction_service = LLMExtractionService(db=self.patient_db, llm=llm)

        try:
            extracted = await extraction_service.extract_patient_profile(
                patient_id=patient_id,
                consultation_id=consultation_id,
            )
            extracted.status = "completed"

            patient = await self.patient_db.get(patient_id)
            if patient is None:
                await self.job_queue.update_status(
                    job_id=job_id,
                    status="failed",
                    error=f"Patient with id '{patient_id}' not found.",
                )
                return
            consultation = patient.consultation_records.get(consultation_id)
            if consultation is None:
                await self.job_queue.update_status(
                    job_id=job_id,
                    status="failed",
                    error=(
                        f"Consultation with id '{consultation_id}' "
                        f"not found for patient '{patient_id}'."
                    ),
                )
                return

            consultation.llm_extracted = extracted
            patient.consultation_records[consultation_id] = consultation
            await self.patient_db.save(patient)
            await self.job_queue.update_status(job_id=job_id, status="completed")
        except Exception as exc:
            await self.job_queue.update_status(
                job_id=job_id,
                status="failed",
                error=str(exc),
            )
            await self.set_consultation_extraction_status(
                patient_id=patient_id,
                consultation_id=consultation_id,
                status_value="failed",
            )
