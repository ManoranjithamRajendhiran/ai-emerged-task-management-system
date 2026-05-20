from pydantic import BaseModel
from datetime import date
from uuid import UUID
from typing import Optional


class ProjectResponse(BaseModel):
    project_id: UUID
    title: str
    description: str
    status: str
    # FIX: dates were non-optional — crashed if a project was saved without dates
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    class Config:
        from_attributes = True