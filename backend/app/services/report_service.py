"""
report_service.py
Fetches data from DB, formats it, calls the ReportAgent.
Drop this into app/services/report_service.py
"""
from sqlalchemy.orm import Session
from app.agents.report_agent import ReportAgent


def _build_overall_context(db: Session) -> str:
    """Pull all projects, tasks, users and format into a prompt string."""
    from app.models.project import Project
    from app.models.task import Task
    from app.models.user import User
    from app.models.productivity import Productivity

    projects = db.query(Project).all()
    tasks = db.query(Task).all()
    users = db.query(User).all()

    # Try productivity model — skip gracefully if table doesn't exist
    try:
        productivity = db.query(Productivity).all()
        prod_map = {str(p.user_id): p.tasks_completed for p in productivity}
    except Exception:
        prod_map = {}

    user_map = {str(u.user_id): u.name for u in users}

    lines = []

    lines.append("=== PROJECTS ===")
    if projects:
        for p in projects:
            lines.append(
                f"- {p.title} | status: {getattr(p,'status','N/A')} "
                f"| start: {getattr(p,'start_date','N/A')} "
                f"| end: {getattr(p,'end_date','N/A')}"
            )
    else:
        lines.append("No projects found.")

    lines.append("\n=== TASKS ===")
    if tasks:
        for t in tasks:
            assignee = user_map.get(str(getattr(t, "assigned_to", "")), "Unassigned")
            lines.append(
                f"- {t.title} | status: {t.status} | priority: {t.priority} "
                f"| assigned_to: {assignee} "
                f"| due: {getattr(t,'due_date','N/A')} "
                f"| points: {getattr(t,'productivity_points',0)}"
            )
    else:
        lines.append("No tasks found.")

    lines.append("\n=== TEAM MEMBERS ===")
    if users:
        for u in users:
            completed = prod_map.get(str(u.user_id), 0)
            lines.append(
                f"- {u.name} | role: {u.role} "
                f"| skills: {getattr(u,'skills','N/A')} "
                f"| tasks_completed: {completed}"
            )
    else:
        lines.append("No users found.")

    return "\n".join(lines)


def _build_member_context(db: Session, user_id: str) -> str:
    """Pull one member's data and their tasks."""
    from app.models.user import User
    from app.models.task import Task
    from app.models.productivity import Productivity

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return f"No member found with id {user_id}"

    tasks = db.query(Task).filter(Task.assigned_to == user_id).all()

    try:
        prod = db.query(Productivity).filter(
            Productivity.user_id == user_id
        ).first()
        tasks_completed = prod.tasks_completed if prod else 0
    except Exception:
        tasks_completed = len([t for t in tasks if t.status == "COMPLETED"])

    lines = []
    lines.append("=== MEMBER PROFILE ===")
    lines.append(f"Name: {user.name}")
    lines.append(f"Role: {user.role}")
    lines.append(f"Skills: {getattr(user, 'skills', 'N/A')}")
    lines.append(f"Tasks Completed (total): {tasks_completed}")

    lines.append("\n=== ASSIGNED TASKS ===")
    if tasks:
        for t in tasks:
            lines.append(
                f"- {t.title} | status: {t.status} | priority: {t.priority} "
                f"| due: {getattr(t,'due_date','N/A')} "
                f"| points: {getattr(t,'productivity_points',0)}"
            )
    else:
        lines.append("No tasks assigned.")

    return "\n".join(lines)


def generate_report(db: Session) -> str:
    context = _build_overall_context(db)
    agent = ReportAgent()
    return agent.generate_report(context)


def generate_member_report(db: Session, user_id: str) -> str:
    context = _build_member_context(db, user_id)
    agent = ReportAgent()
    return agent.generate_member_report(context)