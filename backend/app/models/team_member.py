from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

import uuid

from app.database.database import Base


class TeamMember(Base):

    __tablename__ = "team_members"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    team_id = Column(
        UUID(as_uuid=True),
        ForeignKey("teams.team_id")
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id")
    )