from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db, settings
from app.routers import modules, skills, syllabuses


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Syllabus Planner API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip()
                   for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(syllabuses.router)
app.include_router(modules.router)
app.include_router(skills.router)


@app.get("/health")
def healthcheck():
    return {"status": "ok"}
