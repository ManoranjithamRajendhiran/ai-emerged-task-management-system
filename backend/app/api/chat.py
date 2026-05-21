from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database.database import get_db
from app.models.chat import ChatRoom, ChatRoomMember, ChatMessage
from app.models.user import User
from app.auth.auth_bearer import JWTBearer
from app.auth.current_user import get_current_user
from jose import jwt
from dotenv import load_dotenv
import os
import json
from datetime import datetime

load_dotenv()
router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "changeme_use_a_real_secret_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# ── In-memory connection manager ─────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        # room_id -> list of (websocket, user_id, user_name)
        self.rooms: dict[str, list] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, user_name: str):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        self.rooms[room_id].append((websocket, user_id, user_name))

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms:
            self.rooms[room_id] = [(ws, uid, un) for ws, uid, un in self.rooms[room_id] if ws != websocket]

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.rooms:
            dead = []
            for ws, uid, un in self.rooms[room_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    dead.append(ws)
            # clean dead connections
            self.rooms[room_id] = [(ws, uid, un) for ws, uid, un in self.rooms[room_id] if ws not in dead]

manager = ConnectionManager()

# ── Schemas ───────────────────────────────────────────────────────────────────
class CreateRoomRequest(BaseModel):
    name: str
    room_type: str = "group"       # "group" | "direct" | "meeting"
    member_ids: list[str] = []
    project_id: Optional[str] = None

class SendMessageRequest(BaseModel):
    content: str

# ── REST endpoints ────────────────────────────────────────────────────────────

@router.post("/rooms", dependencies=[Depends(JWTBearer())])
def create_room(
    body: CreateRoomRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # For direct chats: name is auto-generated, exactly 2 members required
    if body.room_type == "direct":
        if len(body.member_ids) != 1:
            raise HTTPException(status_code=400, detail="Direct chat requires exactly 1 other member")
        other_id = body.member_ids[0]
        other = db.query(User).filter(User.user_id == other_id).first()
        if not other:
            raise HTTPException(status_code=404, detail="User not found")
        # Check if direct room already exists between these two users
        my_rooms = db.query(ChatRoomMember).filter(ChatRoomMember.user_id == current_user["user_id"]).all()
        my_room_ids = [str(m.room_id) for m in my_rooms]
        for rid in my_room_ids:
            room = db.query(ChatRoom).filter(
                ChatRoom.room_id == rid,
                ChatRoom.room_type == "direct"
            ).first()
            if room:
                other_member = db.query(ChatRoomMember).filter(
                    ChatRoomMember.room_id == rid,
                    ChatRoomMember.user_id == other_id
                ).first()
                if other_member:
                    return {"room_id": str(room.room_id), "name": room.name, "room_type": room.room_type, "already_exists": True}
        me = db.query(User).filter(User.user_id == current_user["user_id"]).first()
        room_name = f"{me.name} & {other.name}"
    else:
        room_name = body.name

    room = ChatRoom(
        name=room_name,
        room_type=body.room_type,
        created_by=current_user["user_id"],
        project_id=body.project_id or None
    )
    db.add(room)
    db.flush()

    # Always add creator
    db.add(ChatRoomMember(room_id=room.room_id, user_id=current_user["user_id"]))
    # Add other members
    for uid in body.member_ids:
        if uid != current_user["user_id"]:
            db.add(ChatRoomMember(room_id=room.room_id, user_id=uid))

    db.commit()
    db.refresh(room)
    return {"room_id": str(room.room_id), "name": room.name, "room_type": room.room_type}


@router.get("/rooms", dependencies=[Depends(JWTBearer())])
def get_my_rooms(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    memberships = db.query(ChatRoomMember).filter(
        ChatRoomMember.user_id == current_user["user_id"]
    ).all()
    result = []
    for m in memberships:
        room = db.query(ChatRoom).filter(ChatRoom.room_id == m.room_id).first()
        if not room:
            continue
        # Get member list
        members = db.query(ChatRoomMember).filter(ChatRoomMember.room_id == room.room_id).all()
        member_names = []
        for mem in members:
            u = db.query(User).filter(User.user_id == mem.user_id).first()
            if u:
                member_names.append({"user_id": str(u.user_id), "name": u.name, "role": u.role})
        # Last message
        last_msg = db.query(ChatMessage).filter(
            ChatMessage.room_id == room.room_id,
            ChatMessage.is_deleted == False
        ).order_by(ChatMessage.sent_at.desc()).first()
        result.append({
            "room_id": str(room.room_id),
            "name": room.name,
            "room_type": room.room_type,
            "project_id": str(room.project_id) if room.project_id else None,
            "members": member_names,
            "last_message": {
                "content": last_msg.content,
                "sent_at": last_msg.sent_at.isoformat()
            } if last_msg else None
        })
    return result


@router.get("/rooms/{room_id}/messages", dependencies=[Depends(JWTBearer())])
def get_messages(
    room_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Verify membership
    member = db.query(ChatRoomMember).filter(
        ChatRoomMember.room_id == room_id,
        ChatRoomMember.user_id == current_user["user_id"]
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this room")

    messages = db.query(ChatMessage).filter(
        ChatMessage.room_id == room_id,
        ChatMessage.is_deleted == False
    ).order_by(ChatMessage.sent_at.asc()).all()

    result = []
    for msg in messages:
        sender = db.query(User).filter(User.user_id == msg.sender_id).first()
        result.append({
            "message_id": str(msg.message_id),
            "sender_id": str(msg.sender_id),
            "sender_name": sender.name if sender else "Unknown",
            "sender_role": sender.role if sender else "",
            "content": msg.content,
            "sent_at": msg.sent_at.isoformat()
        })
    return result


@router.post("/rooms/{room_id}/members", dependencies=[Depends(JWTBearer())])
def add_member_to_room(
    room_id: str,
    body: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    room = db.query(ChatRoom).filter(ChatRoom.room_id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    user_id = body.get("user_id")
    existing = db.query(ChatRoomMember).filter(
        ChatRoomMember.room_id == room_id,
        ChatRoomMember.user_id == user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already in room")
    db.add(ChatRoomMember(room_id=room_id, user_id=user_id))
    db.commit()
    return {"message": "Member added"}


# ── WebSocket ─────────────────────────────────────────────────────────────────
@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: str,
    db: Session = Depends(get_db)
):
    # Authenticate via token query param
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        user_name = payload.get("name", payload.get("email", "Unknown"))
    except Exception:
        await websocket.close(code=4001)
        return

    # Verify membership
    member = db.query(ChatRoomMember).filter(
        ChatRoomMember.room_id == room_id,
        ChatRoomMember.user_id == user_id
    ).first()
    if not member:
        await websocket.close(code=4003)
        return

    # Get display name from DB
    user = db.query(User).filter(User.user_id == user_id).first()
    display_name = user.name if user else user_name

    await manager.connect(websocket, room_id, user_id, display_name)

    # Broadcast join notification
    await manager.broadcast(room_id, {
        "type": "system",
        "content": f"{display_name} joined",
        "sent_at": datetime.utcnow().isoformat()
    })

    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)
            content = msg_data.get("content", "").strip()
            if not content:
                continue

            # Persist message
            new_msg = ChatMessage(
                room_id=room_id,
                sender_id=user_id,
                content=content
            )
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)

            # Broadcast to all room members
            await manager.broadcast(room_id, {
                "type": "message",
                "message_id": str(new_msg.message_id),
                "sender_id": user_id,
                "sender_name": display_name,
                "sender_role": user.role if user else "",
                "content": content,
                "sent_at": new_msg.sent_at.isoformat()
            })

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        await manager.broadcast(room_id, {
            "type": "system",
            "content": f"{display_name} left",
            "sent_at": datetime.utcnow().isoformat()
        })