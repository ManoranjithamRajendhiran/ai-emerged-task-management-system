from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.productivity import Productivity
from app.auth.auth_bearer import JWTBearer

router = APIRouter()

@router.get("/all", dependencies=[Depends(JWTBearer())])
def get_productivity(db: Session = Depends(get_db)):
    productivity = db.query(Productivity).all()
    # FIX: model field is "completed_tasks" but frontend reads "tasks_completed" — map it correctly
    return [
        {
            "id": str(p.productivity_id),
            "user_id": str(p.user_id),
            "tasks_completed": p.completed_tasks or 0,   # renamed to match frontend
            "delayed_tasks": p.delayed_tasks or 0,
            "productivity_points": p.productivity_points or 0,
        }
        for p in productivity
    ]