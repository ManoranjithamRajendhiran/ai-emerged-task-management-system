from app.database.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT DEFAULT ''"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR DEFAULT ''"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS github_summary TEXT DEFAULT ''"))
    conn.commit()

print("Columns added successfully!")