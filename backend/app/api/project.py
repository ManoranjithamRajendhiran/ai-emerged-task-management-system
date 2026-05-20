from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.project import Project
from app.schemas.project_schema import ProjectCreate
from app.schemas.project_response import ProjectResponse
from app.auth.auth_bearer import JWTBearer
from app.auth.current_user import get_current_user
from app.auth.permissions import require_role
from app.core.roles import PROJECT_MANAGER, PROJECT_SUCCESS_MANAGER

router = APIRouter()


@router.post("/create", dependencies=[Depends(JWTBearer())])
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # FIX: PROJECT_SUCCESS_MANAGER should also be able to create projects
    require_role(current_user, [PROJECT_MANAGER, PROJECT_SUCCESS_MANAGER])

    new_project = Project(
        title=project.title,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return {"message": "Project created successfully", "project_id": str(new_project.project_id)}


@router.get("/all", response_model=list[ProjectResponse], dependencies=[Depends(JWTBearer())])
def get_all_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()


@router.get("/{project_id}", dependencies=[Depends(JWTBearer())])
def get_project_by_id(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    # FIX: was returning {"message": "Project not found"} with HTTP 200 — now proper 404
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project