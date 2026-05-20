from pydantic import BaseModel

from datetime import date


class ProjectCreate(BaseModel):

    title: str

    description: str

    start_date: date

    end_date: date