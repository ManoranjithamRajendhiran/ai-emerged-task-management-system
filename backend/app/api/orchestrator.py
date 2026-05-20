from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.orchestrator_service import (
    run_project_workflow
)

from app.auth.auth_bearer import JWTBearer


router = APIRouter()


@router.post(
    "/run-workflow",
    dependencies=[Depends(JWTBearer())]
)
def run_workflow(
    project_title: str,
    project_id: str,
    db: Session = Depends(get_db)
):

    result = run_project_workflow(
        db,
        project_title,
        project_id
    )

    return result