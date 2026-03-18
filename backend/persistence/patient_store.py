from __future__ import annotations

from typing import Protocol

from models.patients import Patient


class PatientStore(Protocol):
    async def get_id(self) -> int:
        ...

    async def save(self, patient: Patient) -> None:
        ...

    async def get(self, patient_id: int) -> Patient | None:
        ...

    async def get_all(self) -> list[Patient]:
        ...

