from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database.database import Base


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    room_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    # "group" | "direct" | "meeting"
    room_type = Column(String, nullable=False, default="group")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    # for meeting rooms: linked project
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.project_id"), nullable=True)


class ChatRoomMember(Base):
    __tablename__ = "chat_room_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(UUID(as_uuid=True), ForeignKey("chat_rooms.room_id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    joined_at = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(UUID(as_uuid=True), ForeignKey("chat_rooms.room_id"))
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"))
    content = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)