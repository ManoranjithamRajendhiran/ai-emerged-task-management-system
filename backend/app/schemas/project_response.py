from pydantic import BaseModel

from datetime import date
from uuid import UUID

class ProjectResponse(BaseModel):

    project_id: UUID
    title: str
    description: str
    status: str
    start_date: date
    end_date: date

    class Config:
        from_attributes = True