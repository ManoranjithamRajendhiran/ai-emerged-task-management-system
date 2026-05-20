from fastapi import APIRouter, Depends

from app.services.meeting_service import (
    summarize_meeting
)

from app.auth.auth_bearer import JWTBearer


router = APIRouter()


@router.post(
    "/summarize",
    dependencies=[Depends(JWTBearer())]
)
def summarize(
    transcript: str
):

    result = summarize_meeting(
        transcript
    )

    return {
        "meeting_summary": result
    }