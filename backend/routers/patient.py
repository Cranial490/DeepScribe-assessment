from datetime import date, datetime

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, field_validator

from models.patients import Patient

router = APIRouter(prefix="/patient", tags=["patient"])


class CreatePatientRequest(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date | None = None

    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(cls, value: date | None) -> date | None:
        if value is None:
            return value

        today = date.today()
        if value > today:
            raise ValueError("date_of_birth cannot be in the future.")

        try:
            oldest_allowed = today.replace(year=today.year - 130)
        except ValueError:
            oldest_allowed = today.replace(year=today.year - 130, day=28)

        if value < oldest_allowed:
            raise ValueError(
                f"date_of_birth is unrealistically old. Earliest allowed: {oldest_allowed.isoformat()}."
            )

        return value


@router.get("/")
async def get_patients(request: Request) -> list[dict[str, object]]:
    patient_db = request.app.state.patient_db
    return [
        patient.model_dump(
            mode="json",
            include={"id", "first_name", "last_name", "date_of_birth", "created_at"},
        )
        for patient in await patient_db.get_all()
    ]


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_patient(payload: CreatePatientRequest, request: Request) -> dict[str, object]:
    patient_db = request.app.state.patient_db
    patient_id = await patient_db.get_id()
    patient = Patient(
        id=patient_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        date_of_birth=payload.date_of_birth,
        created_at=datetime.utcnow(),
    )
    await patient_db.save(patient)
    return patient.model_dump(mode="json")


@router.get("/{patient_id}/consultations")
async def get_patient_consultations(patient_id: int, request: Request) -> list[dict[str, object]]:
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
    patient_id: int,
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

    if consultation.status in {"processing", "failed"}:
        return {"status": consultation.status}

    if consultation.llm_extracted is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"LLM extracted object not found for consultation '{consultation_id}' "
                f"of patient '{patient_id}'."
            ),
        )

    return consultation.llm_extracted.model_dump(mode="json")


@router.get("/{patient_id}")
async def get_patient(patient_id: int, request: Request) -> dict[str, object]:
    patient_db = request.app.state.patient_db
    patient = await patient_db.get(patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id '{patient_id}' not found.",
        )
    return patient.model_dump(mode="json")
