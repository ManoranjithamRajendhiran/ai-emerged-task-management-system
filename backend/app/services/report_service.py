from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.productivity import Productivity
from app.models.user import User

from langchain_groq import ChatGroq

from dotenv import load_dotenv

import os

load_dotenv()


def generate_report(db: Session):

    tasks = db.query(Task).all()

    productivity = db.query(
        Productivity
    ).all()

    users = db.query(User).all()

    task_summary = []

    for task in tasks:

        task_summary.append({
            "title": task.title,
            "status": task.status,
            "priority": task.priority
        })

    productivity_summary = []

    for item in productivity:

        productivity_summary.append({
            "user_id": str(item.user_id),
            "completed_tasks": item.completed_tasks,
            "points": item.productivity_points
        })

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        groq_api_key=os.getenv("GROQ_API_KEY")
    )

    prompt = f"""
    Generate a professional project report.

    Tasks:
    {task_summary}

    Productivity:
    {productivity_summary}

    Include:
    - project progress
    - completed tasks
    - delayed tasks
    - top performers
    - overall summary
    """

    response = llm.invoke(prompt)

    return response.content