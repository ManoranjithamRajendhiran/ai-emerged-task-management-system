from sqlalchemy.orm import Session

from app.models.productivity import Productivity


def update_productivity(
    db: Session,
    user_id,
    task_status
):

    productivity = db.query(Productivity).filter(
        Productivity.user_id == user_id
    ).first()

    if not productivity:

        productivity = Productivity(
            user_id=user_id,
            completed_tasks=0,
            delayed_tasks=0,
            productivity_points=0
        )

        db.add(productivity)

        db.commit()

        db.refresh(productivity)

    if productivity.completed_tasks is None:
        productivity.completed_tasks = 0

    if productivity.delayed_tasks is None:
        productivity.delayed_tasks = 0

    if productivity.productivity_points is None:
        productivity.productivity_points = 0

    if task_status == "COMPLETED":

        productivity.completed_tasks += 1

        productivity.productivity_points += 10

    elif task_status == "DELAYED":

        productivity.delayed_tasks += 1

        productivity.productivity_points -= 5

    db.commit()