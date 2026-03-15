from datetime import datetime

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel

from models.patients import Patient

router = APIRouter(prefix="/patient", tags=["patient"])


class CreatePatientRequest(BaseModel):
    id: str
    first_name: str
    last_name: str


@router.get("/")
async def get_patients(request: Request) -> list[dict[str, object]]:
    patient_db = request.app.state.patient_db
    return [patient.model_dump(mode="json") for patient in await patient_db.get_all()]


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_patient(payload: CreatePatientRequest, request: Request) -> dict[str, object]:
    patient_db = request.app.state.patient_db
    existing = await patient_db.get(payload.id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Patient with id '{payload.id}' already exists.",
        )

    patient = Patient(
        id=payload.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        created_at=datetime.utcnow(),
    )
    await patient_db.save(patient)
    return patient.model_dump(mode="json")


@router.get("/{patient_id}/consultations")
async def get_patient_consultations(patient_id: str, request: Request) -> list[dict[str, object]]:
    patient_db = request.app.state.patient_db
    patient = await patient_db.get(patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id '{patient_id}' not found.",
        )

    return [
        consultation.model_dump(mode="json")
        for consultation in patient.consultation_records.values()
    ]


@router.get("/{patient_id}/consultations/{consultation_id}/extracted")
async def get_consultation_extracted(
    patient_id: str,
    consultation_id: str,
    request: Request,
) -> dict[str, object]:
    patient_db = request.app.state.patient_db
    patient = await patient_db.get(patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id '{patient_id}' not found.",
        )

    consultation = patient.consultation_records.get(consultation_id)
    if consultation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Consultation with id '{consultation_id}' not found "
                f"for patient '{patient_id}'."
            ),
        )

    if consultation.llm_extracted is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"LLM extracted object not found for consultation '{consultation_id}' "
                f"of patient '{patient_id}'."
            ),
        )

    if consultation.llm_extracted.status in {"processing", "failed"}:
        return {"status": consultation.llm_extracted.status}

    return consultation.llm_extracted.model_dump(mode="json")


@router.get("/{patient_id}")
async def get_patient(patient_id: str, request: Request) -> dict[str, object]:
    patient_db = request.app.state.patient_db
    patient = await patient_db.get(patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id '{patient_id}' not found.",
        )
    return patient.model_dump(mode="json")
