from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.task import Task
from app.schemas.task_schema import TaskCreate, TaskStatusUpdate, TaskUpdate
from app.services.productivity_service import update_productivity
from app.auth.auth_bearer import JWTBearer
from app.auth.current_user import get_current_user
from app.auth.permissions import require_role
from app.core.roles import TEAM_LEAD, TEAM_MEMBER, PROJECT_MANAGER, PROJECT_SUCCESS_MANAGER

router = APIRouter()

VALID_STATUSES = {"PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"}
VALID_PRIORITIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}

@router.post("/create", dependencies=[Depends(JWTBearer())])
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # FIX: was TEAM_LEAD only — PROJECT_MANAGER and PROJECT_SUCCESS_MANAGER also need to create tasks
    require_role(current_user, [TEAM_LEAD, PROJECT_MANAGER, PROJECT_SUCCESS_MANAGER])

    # FIX: validate priority value
    if task.priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=400, detail=f"Invalid priority. Must be one of: {', '.join(VALID_PRIORITIES)}")

    new_task = Task(
        project_id=task.project_id,
        assigned_to=task.assigned_to,
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=task.due_date
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return {"message": "Task created successfully", "task_id": str(new_task.task_id)}


@router.put("/status/{task_id}", dependencies=[Depends(JWTBearer())])
def update_task_status(
    task_id: str,
    status_update: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # FIX: all roles should be able to update status (team lead/manager need it too)
    require_role(current_user, [TEAM_MEMBER, TEAM_LEAD, PROJECT_MANAGER, PROJECT_SUCCESS_MANAGER])

    # FIX: validate status value
    if status_update.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}")

    task = db.query(Task).filter(Task.task_id == task_id).first()

    # FIX: was returning {"message": "Task not found"} with HTTP 200 — now proper 404
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = status_update.status
    update_productivity(db, task.assigned_to, status_update.status)

    if status_update.status == "COMPLETED":
        task.productivity_points += 10

    db.commit()
    return {"message": "Task status updated"}


@router.put("/{task_id}", dependencies=[Depends(JWTBearer())])
def update_task(
    task_id: str,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Update a task with new title, description, priority, due_date, or assignment"""
    require_role(current_user, [TEAM_MEMBER, TEAM_LEAD, PROJECT_MANAGER, PROJECT_SUCCESS_MANAGER])

    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Validate priority if provided
    if task_update.priority and task_update.priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=400, detail=f"Invalid priority. Must be one of: {', '.join(VALID_PRIORITIES)}")

    # Update fields if provided
    if task_update.title is not None:
        task.title = task_update.title
    if task_update.description is not None:
        task.description = task_update.description
    if task_update.priority is not None:
        task.priority = task_update.priority
    if task_update.due_date is not None:
        task.due_date = task_update.due_date
    if task_update.assigned_to is not None:
        task.assigned_to = task_update.assigned_to

    db.commit()
    db.refresh(task)
    return {
        "message": "Task updated successfully",
        "task_id": str(task.task_id),
        "task": {
            "task_id": str(task.task_id),
            "project_id": str(task.project_id),
            "assigned_to": str(task.assigned_to),
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "status": task.status,
            "due_date": str(task.due_date) if task.due_date else None,
            "productivity_points": task.productivity_points,
        }
    }


@router.delete("/{task_id}", dependencies=[Depends(JWTBearer())])
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Delete a task by ID (only PROJECT_MANAGER, PROJECT_SUCCESS_MANAGER, TEAM_LEAD can delete)"""
    require_role(current_user, [TEAM_LEAD, PROJECT_MANAGER, PROJECT_SUCCESS_MANAGER])

    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully", "task_id": str(task_id)}


@router.get("/all", dependencies=[Depends(JWTBearer())])
def get_all_tasks(db: Session = Depends(get_db)):
    tasks = db.query(Task).all()
    return [
        {
            "task_id": str(t.task_id),
            "project_id": str(t.project_id),
            "assigned_to": str(t.assigned_to),
            "title": t.title,
            "description": t.description,
            "priority": t.priority,
            "status": t.status,
            "due_date": str(t.due_date) if t.due_date else None,
            "productivity_points": t.productivity_points,
        }
        for t in tasks
    ]