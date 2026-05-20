from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.project import Project
from app.models.task import Task
from app.schemas.project_schema import ProjectCreate, ProjectUpdate
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


@router.put("/{project_id}", dependencies=[Depends(JWTBearer())])
def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Update a project with new title, description, start_date, or end_date"""
    require_role(current_user, [PROJECT_MANAGER, PROJECT_SUCCESS_MANAGER])

    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate dates if provided
    if project_update.start_date and project_update.end_date:
        if project_update.end_date < project_update.start_date:
            raise HTTPException(status_code=400, detail="End date must be after start date")
    elif project_update.end_date and project.start_date:
        if project_update.end_date < project.start_date:
            raise HTTPException(status_code=400, detail="End date must be after start date")

    # Update fields if provided
    if project_update.title is not None:
        project.title = project_update.title
    if project_update.description is not None:
        project.description = project_update.description
    if project_update.start_date is not None:
        project.start_date = project_update.start_date
    if project_update.end_date is not None:
        project.end_date = project_update.end_date

    db.commit()
    db.refresh(project)
    return {
        "message": "Project updated successfully",
        "project_id": str(project.project_id),
        "project": {
            "project_id": str(project.project_id),
            "title": project.title,
            "description": project.description,
            "start_date": str(project.start_date) if project.start_date else None,
            "end_date": str(project.end_date) if project.end_date else None,
        }
    }


@router.delete("/{project_id}", dependencies=[Depends(JWTBearer())])
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Delete a project by ID (only PROJECT_MANAGER, PROJECT_SUCCESS_MANAGER can delete)
    
    Note: This will cascade delete all associated tasks in the project.
    """
    require_role(current_user, [PROJECT_MANAGER, PROJECT_SUCCESS_MANAGER])

    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Cascade delete all tasks in this project
    db.query(Task).filter(Task.project_id == project_id).delete()

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully (including all associated tasks)", "project_id": str(project_id)}