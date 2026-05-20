from sqlalchemy import (
    Column,
    String,
    ForeignKey,
    Date,
    Integer
)

from sqlalchemy.dialects.postgresql import UUID

import uuid

from app.database.database import Base


class Task(Base):

    __tablename__ = "tasks"

    task_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.project_id")
    )

    assigned_to = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id")
    )

    title = Column(
        String,
        nullable=False
    )

    description = Column(
        String,
        nullable=False
    )

    priority = Column(
        String,
        default="MEDIUM"
    )

    status = Column(
        String,
        default="PENDING"
    )

    due_date = Column(Date)

    productivity_points = Column(
        Integer,
        default=0
    )