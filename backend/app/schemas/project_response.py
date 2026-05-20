from pydantic import BaseModel

from datetime import date


class ProjectResponse(BaseModel):

    project_id: str
    title: str
    description: str
    status: str
    start_date: date
    end_date: date

    class Config:
        from_attributes = True