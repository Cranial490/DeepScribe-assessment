from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import InMemoryJobQueue
from persistence.bootstrap import create_postgres_patient_store
from persistence.postgres_patient_db import PostgresPatientDB
from routers.health import router as health_router
from routers.patient import router as patient_router
from routers.transcript import router as transcript_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def setup_data_stores() -> None:
    app.state.patient_db = await create_postgres_patient_store()
    app.state.job_queue = InMemoryJobQueue()


@app.on_event("shutdown")
async def close_data_stores() -> None:
    patient_db = getattr(app.state, "patient_db", None)
    if isinstance(patient_db, PostgresPatientDB):
        await patient_db.close()

app.include_router(health_router)
app.include_router(patient_router)
app.include_router(transcript_router)
