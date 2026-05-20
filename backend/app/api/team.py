from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.team import Team
from app.models.team_member import TeamMember

from app.schemas.team_schema import (
    TeamCreate,
    AddMember
)

from app.auth.auth_bearer import JWTBearer


router = APIRouter()


@router.post(
    "/create",
    dependencies=[Depends(JWTBearer())]
)
def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db)
):

    new_team = Team(
        project_id=team.project_id,
        team_name=team.team_name,
        team_lead_id=team.team_lead_id
    )

    db.add(new_team)

    db.commit()

    db.refresh(new_team)

    return {
        "message": "Team created successfully",
        "team_id": str(new_team.team_id)
    }


@router.post(
    "/add-member",
    dependencies=[Depends(JWTBearer())]
)
def add_member(
    member: AddMember,
    db: Session = Depends(get_db)
):

    new_member = TeamMember(
        team_id=member.team_id,
        user_id=member.user_id
    )

    db.add(new_member)

    db.commit()

    return {
        "message": "Member added successfully"
    }
@router.get(
    "/all",
    dependencies=[Depends(JWTBearer())]
)
def get_all_teams(
    db: Session = Depends(get_db)
):
    teams = db.query(Team).all()
    return [
        {
            "team_id": str(t.team_id),
            "team_name": t.team_name,
            "project_id": str(t.project_id),
            "team_lead_id": str(t.team_lead_id)
        }
        for t in teams
    ]