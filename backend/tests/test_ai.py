import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            ".."
        )
    )
)

from app.services.task_service import (
    generate_tasks
)

from app.database.database import SessionLocal


def test_ai_generation():

    db = SessionLocal()

    result = generate_tasks(
        "AI Task Management System",
        "12345678-1234-1234-1234-123456789012",
        db
    )

    assert result is not None