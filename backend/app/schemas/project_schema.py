from pydantic import BaseModel, field_validator
from datetime import date
from typing import Optional


class ProjectCreate(BaseModel):
    title: str
    description: str
    # FIX: dates were required — make optional so projects can be created without set dates
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("title cannot be empty")
        return v.strip()

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v, info):
        start = info.data.get("start_date")
        if v and start and v < start:
            raise ValueError("end_date must be after start_date")
        return v