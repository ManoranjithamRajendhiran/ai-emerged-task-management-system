from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

import uuid

from app.database.database import Base


class Team(Base):

    __tablename__ = "teams"

    team_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.project_id")
    )

    team_name = Column(
        String,
        nullable=False
    )

    team_lead_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id")
    )