from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import traceback

from app.database.database import get_db
from app.services.report_service import generate_report, generate_member_report
from app.auth.auth_bearer import JWTBearer
from app.auth.current_user import get_current_user
from app.auth.permissions import require_role
from app.core.roles import PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER, TEAM_LEAD

router = APIRouter()


@router.post("/generate", dependencies=[Depends(JWTBearer())])
def generate_ai_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    require_role(current_user, [PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER])
    try:
        report = generate_report(db)
        return {"report": report}
    except Exception as e:
        traceback.print_exc()   # prints full error in your backend terminal
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.post("/member/{user_id}", dependencies=[Depends(JWTBearer())])
def generate_member_ai_report(
    user_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # TEAM_MEMBER can only generate their own report
    allowed_roles = [PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER, TEAM_LEAD]
    if current_user.role not in allowed_roles:
        if str(current_user.user_id) != str(user_id):
            raise HTTPException(
                status_code=403,
                detail="You can only generate a report for yourself"
            )
    try:
        report = generate_member_report(db, user_id)
        return {"report": report}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Member report generation failed: {str(e)}")