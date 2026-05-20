from pydantic import BaseModel

from datetime import date


class TaskCreate(BaseModel):

    project_id: str

    assigned_to: str

    title: str

    description: str

    priority: str

    due_date: date


class TaskStatusUpdate(BaseModel):

    status: str