from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class UserResponse(BaseModel):
    user_id: UUID
    name: str
    email: str
    role: str
    is_available: bool
    skills: Optional[str] = ""
    github_url: Optional[str] = ""
    github_summary: Optional[str] = ""

    class Config:
        from_attributes = True