import unittest
from datetime import datetime
import json

from models.patients import ConsultationRecord, Patient
from persistence.postgres_patient_db import PostgresPatientDB


class FakeAcquireContext:
    def __init__(self, connection):
        self.connection = connection

    async def __aenter__(self):
        return self.connection

    async def __aexit__(self, exc_type, exc, tb):
        return False


class FakeConnection:
    def __init__(self) -> None:
        self.execute_calls: list[tuple[str, tuple[object, ...]]] = []
        self.fetchval_result: object = 1
        self.fetchrow_result: dict[str, object] | None = None
        self.fetch_result: list[dict[str, object]] = []

    async def execute(self, sql: str, *args: object) -> None:
        self.execute_calls.append((sql, args))

    async def fetchval(self, sql: str) -> object:
        self.execute_calls.append((sql, ()))
        return self.fetchval_result

    async def fetchrow(self, sql: str, patient_id: int) -> dict[str, object] | None:
        self.execute_calls.append((sql, (patient_id,)))
        return self.fetchrow_result

    async def fetch(self, sql: str) -> list[dict[str, object]]:
        self.execute_calls.append((sql, ()))
        return self.fetch_result


class FakePool:
    def __init__(self, connection: FakeConnection) -> None:
        self.connection = connection
        self.closed = False

    def acquire(self) -> FakeAcquireContext:
        return FakeAcquireContext(self.connection)

    async def close(self) -> None:
        self.closed = True


def build_patient() -> Patient:
    consultation = ConsultationRecord(
        consultation_id="c1",
        raw_transcript="hello",
        status="completed",
        created_at=datetime(2026, 3, 17, 12, 0, 0),
    )
    return Patient(
        id=10,
        first_name="Ada",
        last_name="Lovelace",
        consultation_records={"c1": consultation},
        created_at=datetime(2026, 3, 17, 11, 0, 0),
    )


class PostgresPatientDBTests(unittest.IsolatedAsyncioTestCase):
    async def test_get_id_returns_sequence_value(self) -> None:
        connection = FakeConnection()
        connection.fetchval_result = 42
        db = PostgresPatientDB(pool=FakePool(connection))

        patient_id = await db.get_id()

        self.assertEqual(patient_id, 42)

    async def test_save_serializes_consultations_and_executes_upsert(self) -> None:
        connection = FakeConnection()
        db = PostgresPatientDB(pool=FakePool(connection))

        patient = build_patient()
        await db.save(patient)

        self.assertTrue(connection.execute_calls)
        _, args = connection.execute_calls[-1]
        self.assertEqual(args[0], 10)
        self.assertEqual(args[1], "Ada")
        self.assertEqual(args[2], "Lovelace")
        self.assertIsInstance(args[5], str)
        consultation_payload = json.loads(args[5])
        self.assertIn("c1", consultation_payload)

    async def test_get_deserializes_to_patient_model(self) -> None:
        connection = FakeConnection()
        connection.fetchrow_result = {
            "id": 5,
            "first_name": "Grace",
            "last_name": "Hopper",
            "date_of_birth": None,
            "created_at": datetime(2026, 1, 1, 9, 0, 0),
            "consultation_records": {
                "c2": {
                    "consultation_id": "c2",
                    "raw_transcript": "sample",
                    "status": "processing",
                    "edited": False,
                    "llm_extracted": None,
                    "created_at": "2026-01-01T10:00:00",
                }
            },
        }
        db = PostgresPatientDB(pool=FakePool(connection))

        patient = await db.get(5)

        self.assertIsNotNone(patient)
        assert patient is not None
        self.assertEqual(patient.id, 5)
        self.assertEqual(patient.first_name, "Grace")
        self.assertIn("c2", patient.consultation_records)

    async def test_get_deserializes_string_consultation_records(self) -> None:
        connection = FakeConnection()
        connection.fetchrow_result = {
            "id": 7,
            "first_name": "Linus",
            "last_name": "Torvalds",
            "date_of_birth": None,
            "created_at": None,
            "consultation_records": "{}",
        }
        db = PostgresPatientDB(pool=FakePool(connection))

        patient = await db.get(7)

        self.assertIsNotNone(patient)
        assert patient is not None
        self.assertEqual(patient.id, 7)
        self.assertEqual(patient.consultation_records, {})

    async def test_get_all_returns_ordered_patients(self) -> None:
        connection = FakeConnection()
        connection.fetch_result = [
            {
                "id": 1,
                "first_name": "A",
                "last_name": "One",
                "date_of_birth": None,
                "created_at": None,
                "consultation_records": {},
            },
            {
                "id": 2,
                "first_name": "B",
                "last_name": "Two",
                "date_of_birth": None,
                "created_at": None,
                "consultation_records": {},
            },
        ]
        db = PostgresPatientDB(pool=FakePool(connection))

        patients = await db.get_all()

        self.assertEqual([patient.id for patient in patients], [1, 2])

    async def test_close_closes_pool(self) -> None:
        connection = FakeConnection()
        pool = FakePool(connection)
        db = PostgresPatientDB(pool=pool)

        await db.close()

        self.assertTrue(pool.closed)


if __name__ == "__main__":
    unittest.main()
