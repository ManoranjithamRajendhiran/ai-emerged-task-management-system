from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.productivity import Productivity
from app.models.user import User
from app.models.project import Project
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

load_dotenv()

def generate_report(db: Session):
    try:
        tasks = db.query(Task).all()
        users = db.query(User).all()
        productivity = db.query(Productivity).all()
        projects = db.query(Project).all()

        # Build lookup maps
        user_map = {str(u.user_id): u.name for u in users}
        project_map = {str(p.project_id): p.title for p in projects}

        # Task summary with names
        task_summary = []
        for t in tasks:
            task_summary.append({
                "title": t.title,
                "status": t.status,
                "priority": t.priority,
                "assigned_to": user_map.get(str(t.assigned_to), "Unknown"),
                "project": project_map.get(str(t.project_id), "Unknown"),
            })

        # Status counts
        total = len(tasks)
        completed = len([t for t in tasks if t.status == "COMPLETED"])
        in_progress = len([t for t in tasks if t.status == "IN_PROGRESS"])
        pending = len([t for t in tasks if t.status == "PENDING"])
        blocked = len([t for t in tasks if t.status == "BLOCKED"])

        # Productivity with names
        productivity_summary = []
        for p in productivity:
            name = user_map.get(str(p.user_id), "Unknown")
            productivity_summary.append({
                "name": name,
                "completed_tasks": p.completed_tasks,
                "points": p.productivity_points,
            })

        # Sort by points descending
        productivity_summary.sort(key=lambda x: x["points"], reverse=True)

        # Member-level breakdown
        member_breakdown = {}
        for t in tasks:
            name = user_map.get(str(t.assigned_to), "Unknown")
            if name not in member_breakdown:
                member_breakdown[name] = {"PENDING": 0, "IN_PROGRESS": 0, "COMPLETED": 0, "BLOCKED": 0}
            member_breakdown[name][t.status] = member_breakdown[name].get(t.status, 0) + 1

        member_text = "\n".join([
            f"  - {name}: {counts.get('COMPLETED',0)} completed, {counts.get('IN_PROGRESS',0)} in progress, {counts.get('PENDING',0)} pending, {counts.get('BLOCKED',0)} blocked"
            for name, counts in member_breakdown.items()
        ])

        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=os.getenv("GROQ_API_KEY")
        )

        prompt = f"""
Generate a professional project management report based on the following real data:

OVERALL STATS:
- Total Tasks: {total}
- Completed: {completed}
- In Progress: {in_progress}
- Pending: {pending}
- Blocked: {blocked}
- Completion Rate: {round((completed/total*100) if total > 0 else 0, 1)}%

PROJECTS: {[p.title for p in projects]}

MEMBER PERFORMANCE:
{member_text}

TOP PERFORMERS BY POINTS:
{chr(10).join([f"  {i+1}. {p['name']} — {p['points']} pts ({p['completed_tasks']} tasks)" for i, p in enumerate(productivity_summary[:5])])}

ALL TASKS:
{chr(10).join([f"  - [{t['status']}] {t['title']} → {t['assigned_to']} ({t['project']})" for t in task_summary])}

Write a detailed professional report with these sections:
1. Executive Summary
2. Project Progress Overview
3. Member Performance Analysis (name each person)
4. Completed Tasks
5. Delayed or Blocked Tasks
6. Top Performers
7. Recommendations

Use real names, real numbers. Be specific and actionable.
"""

        response = llm.invoke(prompt)
        return response.content

    except Exception as e:
        return f"Report generation failed: {str(e)}"