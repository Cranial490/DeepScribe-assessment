from __future__ import annotations

import os

from dotenv import load_dotenv

from persistence.postgres_patient_db import PostgresPatientDB


def get_required_database_url() -> str:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required for Postgres patient persistence.")
    return database_url


async def create_postgres_patient_store() -> PostgresPatientDB:
    database_url = get_required_database_url()
    return await PostgresPatientDB.create(database_url=database_url)

