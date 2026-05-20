from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User

from app.schemas.user_schema import (
    UserCreate,
    UserLogin
)

from app.auth.hashing import (
    hash_password,
    verify_password
)

from app.auth.jwt_handler import (
    create_access_token
)

router = APIRouter()


@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    hashed_password = hash_password(
        user.password
    )

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered"
    }


@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        return {
            "error": "Invalid email"
        }

    if not verify_password(
        user.password,
        db_user.password
    ):
        return {
            "error": "Invalid password"
        }

    access_token = create_access_token(
    {
        "user_id": str(user.user_id),
        "role": user.role,
        "email": user.email
    })

    return {
        "access_token": access_token
    }