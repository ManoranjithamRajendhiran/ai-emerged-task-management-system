from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine, Base
from app.models.user import User

from app.api.auth import router as auth_router
from app.api.user import router as user_router

from app.models.project import Project

from app.api.project import (
    router as project_router
)

from app.models.team import Team
from app.models.team_member import TeamMember

from app.api.team import (
    router as team_router
)

from app.models.task import Task

from app.api.task import (
    router as task_router
)

from app.api.ai import router as ai_router

from app.models.productivity import Productivity

from app.api.productivity import (
    router as productivity_router
)

from app.api.report import (
    router as report_router
) 

from app.api.orchestrator import (
    router as orchestrator_router
)

from app.api.meeting import (
    router as meeting_router
)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


@app.get("/")
def home():

    return {
        "message": "Backend Running"
    }


app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Auth"]
)

app.include_router(
    user_router,
    prefix="/user",
    tags=["User"]
)

app.include_router(
    project_router,
    prefix="/projects",
    tags=["Projects"]
)
app.include_router(
    team_router,
    prefix="/teams",
    tags=["Teams"]
)

app.include_router(
    task_router,
    prefix="/tasks",
    tags=["Tasks"]
)

app.include_router(
    ai_router,
    prefix="/ai",
    tags=["AI"]
)

app.include_router(
    productivity_router,
    prefix="/productivity",
    tags=["Productivity"]
)

app.include_router(
    report_router,
    prefix="/reports",
    tags=["Reports"]
)

from app.api.orchestrator import (
    router as orchestrator_router
)

app.include_router(
    meeting_router,
    prefix="/meeting",
    tags=["Meeting Agent"]
)
