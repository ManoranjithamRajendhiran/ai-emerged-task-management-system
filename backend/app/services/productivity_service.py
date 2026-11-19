from datetime import date

from sqlalchemy.orm import Session

from app.models.productivity import Productivity

COMPLETED_POINTS = 10
LATE_PENALTY = 5


def _get_or_create(db: Session, user_id) -> Productivity:
    productivity = db.query(Productivity).filter(
        Productivity.user_id == user_id
    ).first()

    if not productivity:
        productivity = Productivity(
            user_id=user_id,
            completed_tasks=0,
            delayed_tasks=0,
            productivity_points=0,
        )
        db.add(productivity)
        db.flush()  # no commit here, the caller commits once

    # guard against NULLs in rows created before defaults existed
    productivity.completed_tasks = productivity.completed_tasks or 0
    productivity.delayed_tasks = productivity.delayed_tasks or 0
    productivity.productivity_points = productivity.productivity_points or 0
    return productivity


def update_productivity(db: Session, task, old_status, new_status):
    """
    Adjust the assignee's productivity for a status transition.
    Only transitions into / out of COMPLETED change anything, so
    re-sending the same status can no longer farm points.
    Does NOT commit; the caller commits together with the task update.
    """
    if old_status == new_status or not task.assigned_to:
        return

    entering = new_status == "COMPLETED" and old_status != "COMPLETED"
    leaving = old_status == "COMPLETED" and new_status != "COMPLETED"
    if not entering and not leaving:
        return

    productivity = _get_or_create(db, task.assigned_to)
    is_late = bool(task.due_date and task.due_date < date.today())

    if entering:
        productivity.completed_tasks += 1
        productivity.productivity_points += COMPLETED_POINTS
        task.productivity_points = (task.productivity_points or 0) + COMPLETED_POINTS
        if is_late:
            productivity.delayed_tasks += 1
            productivity.productivity_points -= LATE_PENALTY
    else:  # reopened: undo what completion gave
        productivity.completed_tasks = max(0, productivity.completed_tasks - 1)
        productivity.productivity_points -= COMPLETED_POINTS
        task.productivity_points = max(0, (task.productivity_points or 0) - COMPLETED_POINTS)