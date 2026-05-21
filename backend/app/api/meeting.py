from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.meeting_service import summarize_meeting
from app.auth.auth_bearer import JWTBearer
from app.auth.current_user import get_current_user
from app.auth.permissions import require_role
from app.core.roles import PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER, TEAM_LEAD, TEAM_MEMBER

router = APIRouter()

class MeetingRequest(BaseModel):
    transcript: str

@router.post("/summarize", dependencies=[Depends(JWTBearer())])
def summarize(
    request: MeetingRequest,
    current_user=Depends(get_current_user)
):
    require_role(current_user, [PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER, TEAM_LEAD, TEAM_MEMBER])
    result = summarize_meeting(request.transcript)
    return {"meeting_summary": result}