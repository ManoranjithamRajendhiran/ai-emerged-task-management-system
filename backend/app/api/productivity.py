from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.productivity import Productivity
from app.models.user import User
from app.models.task import Task
from app.auth.auth_bearer import JWTBearer
from app.auth.current_user import get_current_user
from app.auth.permissions import require_role
from app.core.roles import PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

load_dotenv()
router = APIRouter()

@router.get("/all", dependencies=[Depends(JWTBearer())])
def get_productivity(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    require_role(current_user, [PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER])
    productivity = db.query(Productivity).all()
    return [
        {
            "user_id": str(p.user_id),
            "completed_tasks": p.completed_tasks,
            "delayed_tasks": p.delayed_tasks,
            "productivity_points": p.productivity_points,
        }
        for p in productivity
    ]

@router.get("/analyze", dependencies=[Depends(JWTBearer())])
def analyze_productivity(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    require_role(current_user, [PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER])
    try:
        users = db.query(User).all()
        productivity = db.query(Productivity).all()
        tasks = db.query(Task).all()

        prod_map = {str(p.user_id): p for p in productivity}

        member_data = []
        for u in users:
            p = prod_map.get(str(u.user_id))
            user_tasks = [t for t in tasks if str(t.assigned_to) == str(u.user_id)]
            active = len([t for t in user_tasks if t.status == "IN_PROGRESS"])
            pending = len([t for t in user_tasks if t.status == "PENDING"])
            completed = len([t for t in user_tasks if t.status == "COMPLETED"])
            blocked = len([t for t in user_tasks if t.status == "BLOCKED"])
            points = p.productivity_points if p else 0

            member_data.append({
                "name": u.name,
                "role": u.role,
                "skills": u.skills or "Not specified",
                "active_tasks": active,
                "pending_tasks": pending,
                "completed_tasks": completed,
                "blocked_tasks": blocked,
                "total_tasks": len(user_tasks),
                "productivity_points": points,
            })

        member_text = "\n".join([
            f"- {m['name']} ({m['role']}): {m['total_tasks']} total tasks, "
            f"{m['active_tasks']} active, {m['completed_tasks']} completed, "
            f"{m['blocked_tasks']} blocked, {m['productivity_points']} points, "
            f"Skills: {m['skills']}"
            for m in member_data
        ])

        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=os.getenv("GROQ_API_KEY")
        )

        prompt = f"""
You are an AI Productivity Analysis Agent. Analyze this team's workload and productivity:

TEAM DATA:
{member_text}

For each member provide:
1. Productivity Score (0-100)
2. Burnout Risk (LOW / MEDIUM / HIGH)
3. Workload Status (UNDERLOADED / BALANCED / OVERLOADED)
4. Key Strengths
5. Recommendations

Then provide an Overall Team Health Summary.

Return ONLY valid JSON, no markdown:
{{
  "members": [
    {{
      "name": "member name",
      "productivity_score": 85,
      "burnout_risk": "LOW",
      "workload_status": "BALANCED",
      "strengths": "brief strengths",
      "recommendations": "specific actionable advice"
    }}
  ],
  "team_health": "overall team summary",
  "top_performer": "name",
  "at_risk_members": ["name1", "name2"]
}}
"""
        response = llm.invoke(prompt)
        content = response.content.strip()
        if "```" in content:
            content = content.split("```json")[-1].split("```")[0].strip()

        import json
        result = json.loads(content)
        return {"analysis": result}

    except Exception as e:
        return {"error": str(e)}