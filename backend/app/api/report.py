from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.services.report_service import generate_report
from app.auth.auth_bearer import JWTBearer
from app.auth.current_user import get_current_user
from app.auth.permissions import require_role
from app.core.roles import PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER, TEAM_LEAD, TEAM_MEMBER

router = APIRouter()

@router.get("/generate", dependencies=[Depends(JWTBearer())])
def generate_ai_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Overall report: PSM and PM only
    require_role(current_user, [PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER])
    report = generate_report(db)
    return {"report": report}

@router.get("/member/{user_id}", dependencies=[Depends(JWTBearer())])
def generate_member_report(
    user_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Member report: all 4 roles, but TEAM_MEMBER can only see their own
    require_role(current_user, [PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER, TEAM_LEAD, TEAM_MEMBER])

    if current_user["role"] == TEAM_MEMBER and current_user["user_id"] != user_id:
        return {"error": "You can only view your own report"}

    from app.models.task import Task
    from app.models.productivity import Productivity
    from app.models.user import User
    from langchain_groq import ChatGroq
    import os

    member = db.query(User).filter(User.user_id == user_id).first()
    if not member:
        return {"error": "Member not found"}

    tasks = db.query(Task).filter(Task.assigned_to == user_id).all()
    productivity = db.query(Productivity).filter(Productivity.user_id == user_id).first()

    completed = [t for t in tasks if t.status == "COMPLETED"]
    in_progress = [t for t in tasks if t.status == "IN_PROGRESS"]
    pending = [t for t in tasks if t.status == "PENDING"]
    blocked = [t for t in tasks if t.status == "BLOCKED"]

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=os.getenv("GROQ_API_KEY")
    )

    prompt = f"""
Generate a professional individual performance report for: {member.name}
Role: {member.role}
Skills: {member.skills or "Not specified"}

TASK SUMMARY:
- Total Tasks: {len(tasks)}
- Completed: {len(completed)}
- In Progress: {len(in_progress)}
- Pending: {len(pending)}
- Blocked: {len(blocked)}
- Completion Rate: {round(len(completed)/len(tasks)*100 if tasks else 0, 1)}%

PRODUCTIVITY:
- Points Earned: {productivity.productivity_points if productivity else 0}
- Tasks Completed: {productivity.completed_tasks if productivity else 0}

COMPLETED TASKS:
{chr(10).join([f"- {t.title} (Priority: {t.priority})" for t in completed]) or "None yet"}

BLOCKED TASKS:
{chr(10).join([f"- {t.title}" for t in blocked]) or "None"}

Write a detailed report with:
1. Performance Summary
2. Strengths
3. Areas for Improvement
4. Task Completion Analysis
5. Recommendations

Be specific, constructive and professional.
"""

    response = llm.invoke(prompt)
    return {"report": response.content}