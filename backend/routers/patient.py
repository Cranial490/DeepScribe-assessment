from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from db import InMemoryPatientDB
from models.patients import Patient

router = APIRouter(prefix="/patient", tags=["patient"])
db = InMemoryPatientDB()


class CreatePatientRequest(BaseModel):
    id: str
    first_name: str
    last_name: str


@router.get("/")
def get_patients() -> list[dict[str, object]]:
    return [patient.to_dict() for patient in db.get_all()]


@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_patient(payload: CreatePatientRequest) -> dict[str, object]:
    existing = db.get(payload.id)
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
    db.save(patient)
    return patient.to_dict()


@router.get("/{patient_id}")
def get_patient(patient_id: str) -> dict[str, object]:
    patient = db.get(patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id '{patient_id}' not found.",
        )
    return patient.to_dict()
