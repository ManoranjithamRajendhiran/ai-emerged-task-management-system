from pydantic import BaseModel, field_validator
from datetime import date
from typing import Optional

VALID_PRIORITIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
VALID_STATUSES = {"PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"}

class TaskCreate(BaseModel):
    project_id: str
    assigned_to: str
    title: str
    description: str
    priority: str = "MEDIUM"
    # FIX: due_date was required — make it optional so tasks without deadlines can be created
    due_date: Optional[date] = None

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v):
        if v not in VALID_PRIORITIES:
            raise ValueError(f"priority must be one of: {', '.join(VALID_PRIORITIES)}")
        return v

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("title cannot be empty")
        return v.strip()


class TaskStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(VALID_STATUSES)}")
        return v