from sqlalchemy import (
    Column,
    Integer,
    ForeignKey
)

from sqlalchemy.dialects.postgresql import UUID

import uuid

from app.database.database import Base


class Productivity(Base):

    __tablename__ = "productivity"

    productivity_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id")
    )

    completed_tasks = Column(
        Integer,
        default=0
    )

    delayed_tasks = Column(
        Integer,
        default=0
    )

    productivity_points = Column(
        Integer,
        default=0
    )