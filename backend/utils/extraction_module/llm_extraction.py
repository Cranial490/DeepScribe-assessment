from db import InMemoryPatientDB
from models.patients import LLMExtracted
from utils.llm_base import LLMBase
from utils.prompts import PATIENT_PROFILE_EXTRACTION

class LLMExtractionService:
    def __init__(self, db: InMemoryPatientDB, llm: LLMBase) -> None:
        self.db = db
        self.llm = llm

    async def get_consultation_transcript(
        self,
        patient_id: int,
        consultation_id: str,
    ) -> str:
        patient_record = await self.db.get(patient_id)
        if patient_record is None:
            raise ValueError(f"Patient with id '{patient_id}' not found.")

        consultation_record = patient_record.consultation_records.get(consultation_id)
        if consultation_record is None:
            raise ValueError(
                f"Consultation with id '{consultation_id}' not found for patient '{patient_id}'."
            )

        return consultation_record.raw_transcript

    async def extract_patient_profile(
        self,
        patient_id: int,
        consultation_id: str,
    ) -> LLMExtracted:

        transcript = await self.get_consultation_transcript(
            patient_id=patient_id,
            consultation_id=consultation_id,
        )

        system_prompt = (PATIENT_PROFILE_EXTRACTION)

        response = await self.llm.parse(
            model="gpt-5-mini",
            schema=LLMExtracted,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Transcript: {transcript}"},
            ],
        )
        return response
