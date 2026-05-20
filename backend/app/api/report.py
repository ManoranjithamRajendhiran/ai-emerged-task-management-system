from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.report_service import (
    generate_report
)

from app.auth.auth_bearer import JWTBearer
from app.auth.current_user import (
    get_current_user
)

from app.auth.permissions import (
    require_role
)

from app.core.roles import (
    PROJECT_SUCCESS_MANAGER
)


router = APIRouter()


@router.get(
    "/generate",
    dependencies=[Depends(JWTBearer())]
)
def generate_ai_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    require_role(
        current_user,
        [PROJECT_SUCCESS_MANAGER]
    )

    report = generate_report(db)

    return {
        "report": report
    }