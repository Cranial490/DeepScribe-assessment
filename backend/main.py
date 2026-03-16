from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import InMemoryJobQueue, InMemoryPatientDB
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
def setup_in_memory_db() -> None:
    app.state.patient_db = InMemoryPatientDB()
    app.state.job_queue = InMemoryJobQueue()

app.include_router(health_router)
app.include_router(patient_router)
app.include_router(transcript_router)
