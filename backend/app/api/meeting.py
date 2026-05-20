from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.meeting_service import summarize_meeting
from app.auth.auth_bearer import JWTBearer

router = APIRouter()

# FIX: transcript was a query param — long transcripts get truncated/rejected by servers
# Now sent as JSON body
class MeetingRequest(BaseModel):
    transcript: str

@router.post("/summarize", dependencies=[Depends(JWTBearer())])
def summarize(request: MeetingRequest):
    result = summarize_meeting(request.transcript)
    return {"meeting_summary": result}