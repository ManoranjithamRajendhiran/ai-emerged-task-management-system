from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.user import User

from app.auth.auth_bearer import JWTBearer

from app.schemas.user_response import (
    UserResponse
)

router = APIRouter()


@router.get(
    "/profile",
    dependencies=[Depends(JWTBearer())]
)
def profile():

    return {
        "message": "Protected Profile Route"
    }


@router.get(
    "/all",
    response_model=list[UserResponse],
    dependencies=[Depends(JWTBearer())]
)
def get_all_users(
    db: Session = Depends(get_db)
):

    users = db.query(User).all()

    return users