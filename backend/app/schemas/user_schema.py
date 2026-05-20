from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re

ALLOWED_ROLES = {"PROJECT_SUCCESS_MANAGER", "PROJECT_MANAGER", "TEAM_LEAD", "TEAM_MEMBER"}

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    skills: Optional[str] = ""
    github_url: Optional[str] = ""

    # BUG FIX 9: No password validation — weak passwords accepted silently
    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v

    # BUG FIX 10: No name validation — empty/whitespace-only name accepted
    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    # BUG FIX 11: No GitHub URL format validation
    @field_validator("github_url")
    @classmethod
    def validate_github_url(cls, v):
        if v and v.strip():
            if not re.match(r"^https?://(www\.)?github\.com/[\w\-]+/?$", v.strip()):
                raise ValueError("github_url must be a valid GitHub profile URL (e.g. https://github.com/username)")
        return v.strip() if v else ""

    # BUG FIX 12: Role not validated at schema level (only at route level before fix)
    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v not in ALLOWED_ROLES:
            raise ValueError(f"role must be one of: {', '.join(ALLOWED_ROLES)}")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str