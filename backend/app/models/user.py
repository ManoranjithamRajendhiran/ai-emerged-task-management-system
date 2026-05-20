from sqlalchemy import Column, String, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    is_available = Column(Boolean, default=True)
    skills = Column(Text, default="")
    resume_url = Column(String, default="")
    github_url = Column(String, default="")
    github_summary = Column(Text, default="")