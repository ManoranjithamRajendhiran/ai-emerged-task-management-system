from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.services.orchestrator_service import run_project_workflow
from app.auth.auth_bearer import JWTBearer
from app.auth.current_user import get_current_user
from app.auth.permissions import require_role
from app.core.roles import PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER

router = APIRouter()

@router.post("/run-workflow", dependencies=[Depends(JWTBearer())])
def run_workflow(
    project_title: str,
    project_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    require_role(current_user, [PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER])
    result = run_project_workflow(db, project_title, project_id)
    return result