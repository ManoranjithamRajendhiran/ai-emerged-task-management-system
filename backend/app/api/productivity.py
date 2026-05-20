from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.productivity import Productivity

from app.auth.auth_bearer import JWTBearer


router = APIRouter()


@router.get(
    "/all",
    dependencies=[Depends(JWTBearer())]
)
def get_productivity(
    db: Session = Depends(get_db)
):

    productivity = db.query(
        Productivity
    ).all()

    return productivity