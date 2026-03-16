import asyncio
from datetime import datetime
from uuid import uuid4


from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from pydantic import BaseModel

from models.patients import ConsultationRecord, LLMExtracted
from utils.clinical_apis.studies import ClinicalClient
from utils.extraction_module.job_runner import ExtractionJobRunner

router = APIRouter(prefix="/transcript", tags=["transcript"])


class ExtractTranscriptRequest(BaseModel):
    patient_id: int
    consultation_id: str


class EditExtractedRequest(BaseModel):
    patient_id: int
    consultation_id: str
    llm_extracted: LLMExtracted


class TrialSearchRequest(BaseModel):
    patient_id: int
    consultation_id: str
    page_token: str | None = None


def _normalize_unique(values: list[str | None]) -> list[str]:
    seen: set[str] = set()
    normalized: list[str] = []
    for value in values:
        if value is None:
            continue
        cleaned = value.strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(cleaned)
    return normalized


@router.get("/")
def transcript_router_status() -> dict[str, str]:
    return {"router": "transcript"}


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_transcript(
    request: Request,
    patient_id: int = Form(...),
    raw_transcript: str | None = Form(default=None),
    transcript_file: UploadFile | None = File(default=None),
) -> dict[str, object]:
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


@router.post("/extract", status_code=status.HTTP_202_ACCEPTED)
async def extract_transcript(
    payload: ExtractTranscriptRequest,
    request: Request,
) -> dict[str, object]:
    patient_db = request.app.state.patient_db
    job_queue = request.app.state.job_queue

    patient = await patient_db.get(payload.patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id '{payload.patient_id}' not found.",
        )
    if payload.consultation_id not in patient.consultation_records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Consultation with id '{payload.consultation_id}' "
                f"not found for patient '{payload.patient_id}'."
            ),
        )

    job = await job_queue.create_job(
        patient_id=payload.patient_id,
        consultation_id=payload.consultation_id,
    )

    runner = ExtractionJobRunner(app=request.app)
    asyncio.create_task(
        runner.run(
            job_id=job.job_id,
            patient_id=payload.patient_id,
            consultation_id=payload.consultation_id,
        )
    )

    return {
        "submitted": True,
        "job_id": job.job_id,
        "status": job.status,
        "patient_id": payload.patient_id,
        "consultation_id": payload.consultation_id,
    }


@router.get("/extract/jobs/{patient_id}")
async def get_patient_extraction_jobs(
    patient_id: int,
    request: Request,
) -> list[dict[str, object]]:
    patient_db = request.app.state.patient_db
    patient = await patient_db.get(patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id '{patient_id}' not found.",
        )

    job_queue = request.app.state.job_queue
    jobs = await job_queue.get_jobs_for_patient(patient_id)
    return [job.model_dump(mode="json") for job in jobs]


@router.post("/edit")
async def edit_extracted_data(
    payload: EditExtractedRequest,
    request: Request,
) -> dict[str, object]:
    patient_db = request.app.state.patient_db
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

    if consultation.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "LLM extracted data can only be edited when status is 'completed'. "
                f"Current status is '{consultation.status}'."
            ),
        )

    if consultation.llm_extracted is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"LLM extracted object not found for consultation '{payload.consultation_id}' "
                f"of patient '{payload.patient_id}'."
            ),
        )

    current = consultation.llm_extracted.model_dump(mode="python")
    incoming = payload.llm_extracted.model_dump(mode="python")

    if current != incoming:
        consultation.llm_extracted = payload.llm_extracted
        consultation.edited = True
        patient.consultation_records[payload.consultation_id] = consultation
        await patient_db.save(patient)

    return {
        "patient_id": payload.patient_id,
        "consultation_id": payload.consultation_id,
        "llm_extracted": payload.llm_extracted.model_dump(mode="json"),
    }


@router.post("/trials")
async def fetch_trials_from_extracted(
    payload: TrialSearchRequest,
    request: Request,
) -> dict[str, object]:
    patient_db = request.app.state.patient_db
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

    if consultation.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Clinical trial search requires completed extraction. "
                f"Current status is '{consultation.status}'."
            ),
        )

    if consultation.llm_extracted is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"LLM extracted object not found for consultation '{payload.consultation_id}' "
                f"of patient '{payload.patient_id}'."
            ),
        )

    extracted = consultation.llm_extracted
    condition_terms = _normalize_unique(extracted.trial_search.conditions)
    if not condition_terms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot fetch trials: trial_search.conditions is missing.",
        )
    diagnosis = condition_terms[0]

    query_terms = _normalize_unique(extracted.trial_search.keywords)
    location_terms = _normalize_unique(extracted.trial_search.location_terms)

    query_term = " ".join(query_terms) if query_terms else None
    location_text = ", ".join(location_terms) if location_terms else None

    clinical_client = ClinicalClient()
    try:
        return await clinical_client.search_studies(
            diagnosis=diagnosis,
            query_term=query_term,
            location_text=location_text,
            page_token=payload.page_token,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get("/trial/{nctId}")
async def get_trial(nctId: str) -> dict[str, object]:
    clinical_client = ClinicalClient()
    try:
        return await clinical_client.get_study(nct_id=nctId)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
