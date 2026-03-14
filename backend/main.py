from fastapi import FastAPI

from routers.health import router as health_router
from routers.patient import router as patient_router

app = FastAPI()

app.include_router(health_router)
app.include_router(patient_router)
