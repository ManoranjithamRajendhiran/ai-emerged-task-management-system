from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.services.task_service import generate_tasks, get_llm
from app.models.user import User
from app.auth.auth_bearer import JWTBearer
from app.auth.current_user import get_current_user
from app.auth.permissions import require_role
from app.core.roles import PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER
import json

router = APIRouter()

@router.post("/generate-tasks", dependencies=[Depends(JWTBearer())])
def ai_generate_tasks(
    project_title: str,
    project_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    require_role(current_user, [PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER])
    tasks = generate_tasks(project_title, project_id, db)
    return {"ai_tasks": tasks}

@router.post("/suggest-team", dependencies=[Depends(JWTBearer())])
def suggest_team(
    project_title: str,
    project_description: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    require_role(current_user, [PROJECT_SUCCESS_MANAGER, PROJECT_MANAGER])
    try:
        all_users = db.query(User).all()
        employee_profiles = [
            f"- ID: {u.user_id} | Name: {u.name} | Role: {u.role} | Skills: {u.skills or 'Not specified'} | GitHub: {(u.github_summary or '')[:120]}"
            for u in all_users
        ]
        profiles_text = "\n".join(employee_profiles)
        llm = get_llm()
        prompt = f"""
You are an AI HR manager. Suggest the best team for this project:

Project: "{project_title}"
Description: "{project_description}"

Available employees:
{profiles_text}

Select the best team (1 Project Manager role person as team lead, 3-5 team members).
Base your selection on skill relevance to the project.

Return ONLY valid JSON, no markdown:
{{
  "suggested_team_lead": {{
    "user_id": "uuid here",
    "name": "name",
    "reason": "why they should lead"
  }},
  "suggested_members": [
    {{
      "user_id": "uuid here",
      "name": "name",
      "skills": "their relevant skills",
      "reason": "why they fit this project"
    }}
  ],
  "team_summary": "Overall summary of why this team works well together"
}}
"""
        response = llm.invoke(prompt)
        content = response.content.strip()
        if "```" in content:
            content = content.split("```json")[-1].split("```")[0].strip()
        result = json.loads(content)
        return {"suggestion": result}
    except Exception as e:
        return {"error": str(e)}