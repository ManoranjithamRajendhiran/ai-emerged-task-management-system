from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.auth.auth_bearer import JWTBearer
from app.auth.current_user import get_current_user
from app.schemas.user_response import UserResponse
from pydantic import BaseModel

router = APIRouter()


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile"""
    name: str = None
    skills: str = None
    github_url: str = None

    class Config:
        from_attributes = True


@router.get(
    "/profile",
    response_model=UserResponse,
    dependencies=[Depends(JWTBearer())]
)
def get_profile(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get current user's profile based on JWT token"""
    user_id = current_user.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: user_id not found")

    user = db.query(User).filter(User.user_id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.put(
    "/profile",
    response_model=UserResponse,
    dependencies=[Depends(JWTBearer())]
)
def update_profile(
    profile_update: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Update current user's profile (name, skills, github_url)"""
    user_id = current_user.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: user_id not found")

    user = db.query(User).filter(User.user_id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update fields if provided
    if profile_update.name is not None:
        user.name = profile_update.name
    
    if profile_update.skills is not None:
        user.skills = profile_update.skills
    
    if profile_update.github_url is not None:
        user.github_url = profile_update.github_url
        
        # Try to fetch GitHub summary if URL changed
        try:
            import requests
            username = profile_update.github_url.rstrip("/").split("/")[-1]
            resp = requests.get(
                f"https://api.github.com/users/{username}/repos?sort=updated&per_page=10",
                timeout=5
            )
            if resp.status_code == 200:
                langs = list(set(r.get("language") for r in resp.json() if r.get("language")))
                user.github_summary = f"Works with {', '.join(langs[:6])} based on GitHub."
        except Exception:
            user.github_summary = ""

    db.commit()
    db.refresh(user)
    return user


@router.get(
    "/all",
    response_model=list[UserResponse],
    dependencies=[Depends(JWTBearer())]
)
def get_all_users(
    db: Session = Depends(get_db)
):
    """Get all users in the system"""
    users = db.query(User).all()
    return users