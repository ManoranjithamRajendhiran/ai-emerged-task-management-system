from app.database.database import engine
from sqlalchemy import text

print("Running chat migration...")

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS chat_rooms (
            room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR NOT NULL,
            room_type VARCHAR NOT NULL DEFAULT 'group',
            created_by UUID REFERENCES users(user_id),
            created_at TIMESTAMP DEFAULT NOW(),
            project_id UUID REFERENCES projects(project_id) ON DELETE SET NULL
        )
    """))
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS chat_room_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            room_id UUID REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
            joined_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(room_id, user_id)
        )
    """))
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            room_id UUID REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
            sender_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
            content TEXT NOT NULL,
            sent_at TIMESTAMP DEFAULT NOW(),
            is_deleted BOOLEAN DEFAULT FALSE
        )
    """))
    conn.commit()

print("Chat tables created successfully.")