from pydantic import BaseModel


class TeamCreate(BaseModel):

    project_id: str

    team_name: str

    team_lead_id: str


class AddMember(BaseModel):

    team_id: str

    user_id: str