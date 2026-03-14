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
    return [patient.to_dict() for patient in await patient_db.get_all()]


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
    return patient.to_dict()


@router.get("/{patient_id}")
async def get_patient(patient_id: str, request: Request) -> dict[str, object]:
    patient_db = request.app.state.patient_db
    patient = await patient_db.get(patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id '{patient_id}' not found.",
        )
    return patient.to_dict()
