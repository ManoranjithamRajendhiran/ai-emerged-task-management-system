from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserLogin
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt_handler import create_access_token

router = APIRouter()

@router.post("/register", status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # BUG FIX 1: Check for duplicate email before registering
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # BUG FIX 2: Validate role against allowed values
    ALLOWED_ROLES = {"PROJECT_SUCCESS_MANAGER", "PROJECT_MANAGER", "TEAM_LEAD", "TEAM_MEMBER"}
    if user.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(ALLOWED_ROLES)}")

    hashed_password = hash_password(user.password)

    github_summary = ""
    if user.github_url:
        try:
            import requests
            username = user.github_url.rstrip("/").split("/")[-1]
            resp = requests.get(
                f"https://api.github.com/users/{username}/repos?sort=updated&per_page=10",
                timeout=5
            )
            if resp.status_code == 200:
                langs = list(set(r.get("language") for r in resp.json() if r.get("language")))
                github_summary = f"Works with {', '.join(langs[:6])} based on GitHub."
        except Exception:
            github_summary = ""

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role,
        skills=user.skills or "",
        github_url=user.github_url or "",
        github_summary=github_summary
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    # BUG FIX 3: Return user_id so frontend can confirm registration
    return {"message": "User registered successfully", "user_id": str(new_user.user_id)}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    # BUG FIX 4: Use HTTPException instead of returning error dict (which returns 200 status)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access_token = create_access_token({
        "user_id": str(db_user.user_id),
        "role": db_user.role,
        "email": db_user.email
    })
    return {"access_token": access_token, "token_type": "bearer"}