from pydantic import BaseModel
from typing import Optional
from datetime import date

class ProjectCreate(BaseModel):
    title: str
    description: str = ""
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    class Config:
        from_attributes = True


class ProjectUpdate(BaseModel):
    """Schema for updating a project - all fields are optional"""
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    class Config:
        from_attributes = True