from __future__ import annotations

import json
from typing import Any

import asyncpg
from asyncpg import Pool

from models.patients import Patient


CREATE_PATIENTS_SCHEMA_SQL = """
CREATE SEQUENCE IF NOT EXISTS patients_id_seq START WITH 1;

CREATE TABLE IF NOT EXISTS patients (
    id BIGINT PRIMARY KEY DEFAULT nextval('patients_id_seq'),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NULL,
    created_at TIMESTAMPTZ NULL,
    consultation_records JSONB NOT NULL DEFAULT '{}'::jsonb
);
"""

COERCE_CONSULTATION_RECORDS_TO_JSONB_SQL = """
ALTER TABLE patients
ALTER COLUMN consultation_records TYPE JSONB
USING CASE
    WHEN consultation_records IS NULL THEN '{}'::jsonb
    WHEN pg_typeof(consultation_records)::text = 'jsonb' THEN consultation_records
    ELSE consultation_records::jsonb
END;
"""

SYNC_PATIENTS_SEQUENCE_SQL = """
SELECT setval(
    'patients_id_seq',
    COALESCE((SELECT MAX(id) FROM patients), 0) + 1,
    false
);
"""

GET_NEXT_PATIENT_ID_SQL = "SELECT nextval('patients_id_seq')::BIGINT;"

UPSERT_PATIENT_SQL = """
INSERT INTO patients (
    id,
    first_name,
    last_name,
    date_of_birth,
    created_at,
    consultation_records
)
VALUES ($1, $2, $3, $4, $5, $6::jsonb)
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    date_of_birth = EXCLUDED.date_of_birth,
    created_at = EXCLUDED.created_at,
    consultation_records = EXCLUDED.consultation_records;
"""

GET_PATIENT_BY_ID_SQL = """
SELECT id, first_name, last_name, date_of_birth, created_at, consultation_records
FROM patients
WHERE id = $1;
"""

GET_ALL_PATIENTS_SQL = """
SELECT id, first_name, last_name, date_of_birth, created_at, consultation_records
FROM patients
ORDER BY id ASC;
"""


class PostgresPatientDB:
    def __init__(self, pool: Pool) -> None:
        self.pool = pool

    @classmethod
    async def create(cls, database_url: str) -> "PostgresPatientDB":
        pool = await asyncpg.create_pool(dsn=database_url, min_size=1, max_size=10)
        db = cls(pool=pool)
        await db.initialize()
        return db

    async def initialize(self) -> None:
        async with self.pool.acquire() as connection:
            await connection.execute(CREATE_PATIENTS_SCHEMA_SQL)
            try:
                await connection.execute(COERCE_CONSULTATION_RECORDS_TO_JSONB_SQL)
            except Exception:
                # If column already has JSONB type or cast path is unsupported, continue.
                pass
            await connection.execute(SYNC_PATIENTS_SEQUENCE_SQL)

    async def close(self) -> None:
        await self.pool.close()

    async def get_id(self) -> int:
        async with self.pool.acquire() as connection:
            value = await connection.fetchval(GET_NEXT_PATIENT_ID_SQL)
        if not isinstance(value, int):
            raise RuntimeError("Failed to allocate next patient id from Postgres.")
        return value

    async def save(self, patient: Patient) -> None:
        payload = self._serialize_patient(patient)
        async with self.pool.acquire() as connection:
            await connection.execute(
                UPSERT_PATIENT_SQL,
                payload["id"],
                payload["first_name"],
                payload["last_name"],
                payload["date_of_birth"],
                payload["created_at"],
                json.dumps(payload["consultation_records"]),
            )

    async def get(self, patient_id: int) -> Patient | None:
        async with self.pool.acquire() as connection:
            row = await connection.fetchrow(GET_PATIENT_BY_ID_SQL, patient_id)
        if row is None:
            return None
        return self._deserialize_patient(row)

    async def get_all(self) -> list[Patient]:
        async with self.pool.acquire() as connection:
            rows = await connection.fetch(GET_ALL_PATIENTS_SQL)
        return [self._deserialize_patient(row) for row in rows]

    def _serialize_patient(self, patient: Patient) -> dict[str, Any]:
        return {
            "id": patient.id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "date_of_birth": patient.date_of_birth,
            "created_at": patient.created_at,
            "consultation_records": {
                consultation_id: consultation.model_dump(mode="json")
                for consultation_id, consultation in patient.consultation_records.items()
            },
        }

    def _deserialize_patient(self, row: asyncpg.Record) -> Patient:
        consultation_records = row["consultation_records"]
        if isinstance(consultation_records, str):
            try:
                consultation_records = json.loads(consultation_records)
            except json.JSONDecodeError:
                consultation_records = {}
        if consultation_records is None:
            consultation_records = {}

        return Patient.model_validate(
            {
                "id": row["id"],
                "first_name": row["first_name"],
                "last_name": row["last_name"],
                "date_of_birth": row["date_of_birth"],
                "created_at": row["created_at"],
                "consultation_records": consultation_records,
            }
        )
