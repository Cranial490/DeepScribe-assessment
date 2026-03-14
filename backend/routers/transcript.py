import os
from datetime import datetime
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from pydantic import BaseModel

from models.patients import ConsultationRecord
from utils.extraction_module.llm_extraction import LLMExtractionService
from utils.openai_llm import Openai_llm

load_dotenv()

router = APIRouter(prefix="/transcript", tags=["transcript"])


class ExtractTranscriptRequest(BaseModel):
    patient_id: str
    consultation_id: str


@router.get("/")
def transcript_router_status() -> dict[str, str]:
    return {"router": "transcript"}


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_transcript(
    request: Request,
    patient_id: str = Form(...),
    raw_transcript: str | None = Form(default=None),
    transcript_file: UploadFile | None = File(default=None),
) -> dict[str, str]:
    patient_db = request.app.state.patient_db

    if (raw_transcript is None and transcript_file is None) or (
        raw_transcript is not None and transcript_file is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide exactly one transcript input: raw_transcript or transcript_file.",
        )

    patient = await patient_db.get(patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id '{patient_id}' not found.",
        )

    transcript_text = raw_transcript
    if transcript_file is not None:
        transcript_bytes = await transcript_file.read()
        transcript_text = transcript_bytes.decode("utf-8")

    if transcript_text is None or not transcript_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript text cannot be empty.",
        )

    consultation_id = str(uuid4())
    record = ConsultationRecord(
        consultation_id=consultation_id,
        raw_transcript=transcript_text,
        created_at=datetime.utcnow(),
    )
    patient.consultation_records[consultation_id] = record
    await patient_db.save(patient)

    return {
        "patient_id": patient_id,
        "consultation_id": consultation_id,
    }


@router.post("/extract")
async def extract_transcript(
    payload: ExtractTranscriptRequest,
    request: Request,
) -> dict[str, object]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OPENAI_API_KEY is not configured.",
        )

    patient_db = request.app.state.patient_db
    llm = Openai_llm(llm_api_key=api_key)
    extraction_service = LLMExtractionService(db=patient_db, llm=llm)

    try:
        extracted = await extraction_service.extract_patient_profile(
            patient_id=payload.patient_id,
            consultation_id=payload.consultation_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    patient = await patient_db.get(payload.patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id '{payload.patient_id}' not found.",
        )

    consultation = patient.consultation_records.get(payload.consultation_id)
    if consultation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Consultation with id '{payload.consultation_id}' "
                f"not found for patient '{payload.patient_id}'."
            ),
        )

    consultation.llm_extracted = extracted
    patient.consultation_records[payload.consultation_id] = consultation
    await patient_db.save(patient)

    return {
        "patient_id": payload.patient_id,
        "consultation_id": payload.consultation_id,
        "llm_extracted": extracted.model_dump(mode="json"),
    }
