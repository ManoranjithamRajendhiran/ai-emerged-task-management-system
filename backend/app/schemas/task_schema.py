from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class TaskCreate(BaseModel):
    project_id: str
    assigned_to: str
    title: str
    description: str = ""
    priority: str = "MEDIUM"
    due_date: Optional[date] = None

    class Config:
        from_attributes = True


class TaskStatusUpdate(BaseModel):
    status: str = Field(..., description="Status must be one of: PENDING, IN_PROGRESS, COMPLETED, BLOCKED")

    class Config:
        from_attributes = True


class TaskUpdate(BaseModel):
    """Schema for updating a task - all fields are optional"""
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    assigned_to: Optional[str] = None

    class Config:
        from_attributes = True