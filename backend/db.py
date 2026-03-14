from models.patients import Patient


class InMemoryPatientDB:
    def __init__(self) -> None:
        self._patients: dict[str, Patient] = {}

    def save(self, patient: Patient) -> None:
        self._patients[patient.id] = patient

    def get(self, patient_id: str) -> Patient | None:
        return self._patients.get(patient_id)

    def get_all(self) -> list[Patient]:
        return list(self._patients.values())
