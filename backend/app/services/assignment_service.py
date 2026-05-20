from sqlalchemy.orm import Session

from app.models.user import User
from app.models.task import Task


def select_best_user(db: Session):

    users = db.query(User).all()

    best_user = None

    minimum_tasks = 9999

    for user in users:

        task_count = db.query(Task).filter(
            Task.assigned_to == user.user_id,
            Task.status != "COMPLETED"
        ).count()

        if task_count < minimum_tasks:

            minimum_tasks = task_count

            best_user = user

    return best_user