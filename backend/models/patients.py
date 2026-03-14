from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime
import json


@dataclass(slots=True)
class Patient:
    id: str
    first_name: str
    last_name: str
    consultation_records: dict[str, ConsultationRecord] = field(default_factory=dict)
    created_at: datetime | None = None

    def to_dict(self) -> dict[str, object]:
        data = asdict(self)
        if isinstance(self.created_at, datetime):
            data["created_at"] = self.created_at.isoformat()
        return data

    def to_json(self) -> str:
        return json.dumps(self.to_dict())


@dataclass(slots=True)
class ConsultationRecord:
    consultation_id: str
    raw_transcript: str
    llm_extracted: LLMExtracted | None = None
    created_at: datetime | None = None

    def to_dict(self) -> dict[str, object]:
        data = asdict(self)
        if isinstance(self.created_at, datetime):
            data["created_at"] = self.created_at.isoformat()
        return data

    def to_json(self) -> str:
        return json.dumps(self.to_dict())


@dataclass(slots=True)
class Location:
    city: str | None = None
    state: str | None = None
    country: str | None = None


@dataclass(slots=True)
class PatientProfile:
    age: int | None = None
    sex: str | None = None
    location: Location = field(default_factory=Location)


@dataclass(slots=True)
class ClinicalDetails:
    primary_diagnosis: str | None = None
    disease_stage: str | None = None
    biomarkers: list[str] = field(default_factory=list)
    prior_treatments: list[str] = field(default_factory=list)


@dataclass(slots=True)
class TrialSearch:
    conditions: list[str] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)
    location_terms: list[str] = field(default_factory=list)


@dataclass(slots=True)
class AdditionalRelevantFact:
    category: str | None = None
    fact: str | None = None
    source_text: str | None = None


@dataclass(slots=True)
class LLMExtracted:
    patient: PatientProfile = field(default_factory=PatientProfile)
    clinical: ClinicalDetails = field(default_factory=ClinicalDetails)
    trial_search: TrialSearch = field(default_factory=TrialSearch)
    additional_relevant_facts: list[AdditionalRelevantFact] = field(default_factory=list)

    def to_dict(self) -> dict[str, object]:
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(self.to_dict())
