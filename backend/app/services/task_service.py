from langchain_groq import ChatGroq
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.user import User
from app.models.team_member import TeamMember
from app.services.assignment_service import select_best_user_for_task
import os
import json

load_dotenv()

def get_llm():
    return ChatGroq(model="llama-3.1-8b-instant", groq_api_key=os.getenv("GROQ_API_KEY"))

def generate_tasks(project_title, project_id, db: Session):
    """Generate tasks and assign each to the best person based on skills."""
    try:
        # Get all team members for this project's team
        from app.models.team import Team
        team = db.query(Team).filter(Team.project_id == project_id).first()
        
        team_members = []
        if team:
            member_ids = [m.user_id for m in db.query(TeamMember).filter(TeamMember.team_id == team.team_id).all()]
            team_members = db.query(User).filter(User.user_id.in_(member_ids)).all()
        
        if not team_members:
            team_members = db.query(User).all()
        
        # Build team profile for AI
        team_profile = []
        for m in team_members:
            skills = m.skills or "General"
            summary = m.github_summary or ""
            team_profile.append(f"- {m.name} (Role: {m.role}, Skills: {skills}, GitHub: {summary[:100]})")
        
        team_text = "\n".join(team_profile)
        
        llm = get_llm()
        prompt = f"""
You are a project manager AI. Generate exactly 5 software development tasks for this project: "{project_title}"

Team members available:
{team_text}

For each task, assign it to the MOST SUITABLE team member based on their skills.

Return ONLY valid JSON array, no markdown, no explanation:
[
  {{
    "title": "Task title",
    "description": "Detailed task description",
    "priority": "HIGH",
    "assigned_to_name": "Exact name from team list above",
    "reason": "Why this person was chosen"
  }}
]
"""
        response = llm.invoke(prompt)
        content = response.content.strip()
        
        if "```" in content:
            content = content.split("```json")[-1].split("```")[0].strip()
        
        tasks = json.loads(content)
        saved_tasks = []
        
        for item in tasks:
            # Find user by name the AI picked
            assigned_name = item.get("assigned_to_name", "")
            assigned_user = next(
                (m for m in team_members if m.name.lower() == assigned_name.lower()),
                None
            )
            
            # Fallback: skill-based selection
            if not assigned_user:
                assigned_user = select_best_user_for_task(
                    item["title"], item["description"], team_members, db
                )
            
            new_task = Task(
                project_id=project_id,
                assigned_to=assigned_user.user_id,
                title=item["title"],
                description=item["description"],
                priority=item.get("priority", "MEDIUM")
            )
            db.add(new_task)
            saved_tasks.append({
                "title": item["title"],
                "description": item["description"],
                "priority": item.get("priority", "MEDIUM"),
                "assigned_to": assigned_user.name,
                "assigned_to_id": str(assigned_user.user_id),
                "reason": item.get("reason", "Best skill match")
            })
        
        db.commit()
        return saved_tasks
    
    except Exception as e:
        return {"error": str(e)}