from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.task_service import (
    generate_tasks
)

from app.auth.auth_bearer import JWTBearer

router = APIRouter()


@router.post(
    "/generate-tasks",
    dependencies=[Depends(JWTBearer())]
)
def ai_generate_tasks(
    project_title: str,
    project_id: str,
    db: Session = Depends(get_db)
):

    tasks = generate_tasks(
        project_title,
        project_id,
        db
    )

    return {
        "ai_tasks": tasks
    }