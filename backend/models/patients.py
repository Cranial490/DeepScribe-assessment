from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class Location(BaseModel):
    city: str | None = None
    state: str | None = None
    country: str | None = None


class PatientProfile(BaseModel):
    age: int | None = None
    sex: str | None = None
    location: Location = Field(default_factory=Location)


class ClinicalDetails(BaseModel):
    primary_diagnosis: str | None = None
    disease_stage: str | None = None
    biomarkers: list[str] = Field(default_factory=list)
    prior_treatments: list[str] = Field(default_factory=list)


class TrialSearch(BaseModel):
    conditions: list[str] = Field(default_factory=list)
    interventions: list[str] = Field(default_factory=list)
    biomarker_and_molecular_terms: list[str] = Field(default_factory=list)
    preferred_locations: list[str] = Field(default_factory=list)
    sex: Literal["Male", "Female", "All"] | None = None
    age_groups: list[Literal["Child", "Adult", "Older Adult"]] = Field(default_factory=list)


class AdditionalRelevantFact(BaseModel):
    category: str | None = None
    fact: str | None = None
    source_text: str | None = None


class LLMExtracted(BaseModel):
    patient: PatientProfile = Field(default_factory=PatientProfile)
    clinical: ClinicalDetails = Field(default_factory=ClinicalDetails)
    trial_search: TrialSearch = Field(default_factory=TrialSearch)
    additional_relevant_facts: list[AdditionalRelevantFact] = Field(default_factory=list)

class ConsultationRecord(BaseModel):
    consultation_id: str
    raw_transcript: str
    status: Literal["processing", "completed", "failed"] = "processing"
    edited: bool = False
    llm_extracted: LLMExtracted | None = None
    created_at: datetime | None = None


class Patient(BaseModel):
    id: int
    first_name: str
    last_name: str
    date_of_birth: date | None = None
    consultation_records: dict[str, ConsultationRecord] = Field(default_factory=dict)
    created_at: datetime | None = None
