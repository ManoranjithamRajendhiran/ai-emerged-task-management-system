from sqlalchemy import Column, String, Date
from sqlalchemy.dialects.postgresql import UUID

import uuid

from app.database.database import Base


class Project(Base):

    __tablename__ = "projects"

    project_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    title = Column(
        String,
        nullable=False
    )

    description = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        default="PENDING"
    )

    start_date = Column(Date)

    end_date = Column(Date)