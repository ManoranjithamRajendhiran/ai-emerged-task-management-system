from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    skills: Optional[str] = ""
    github_url: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str