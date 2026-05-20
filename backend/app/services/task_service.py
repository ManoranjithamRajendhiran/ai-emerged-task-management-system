from langchain_groq import ChatGroq
from dotenv import load_dotenv

from sqlalchemy.orm import Session

from app.models.task import Task
from app.services.assignment_service import (
    select_best_user
)

import os
import json

load_dotenv()


def generate_tasks(
    project_title,
    project_id,
    db: Session
):

    try:

        groq_key = os.getenv("GROQ_API_KEY")

        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=groq_key
        )

        prompt = f"""
            Generate 5 software development tasks
            for this project:

            {project_title}

            Return ONLY valid JSON.

            Do NOT include:
            - markdown
            - explanation
            - comments
            - code block

            Return format:

            [
            {{
                "title": "Build Login API",
                "description": "Develop JWT login system",
                "priority": "HIGH"
            }}
            ]
            """

        response = llm.invoke(prompt)

        content = response.content.strip()

        print(content)

        if content.startswith("```json"):
            content = content.replace("```json", "")
            content = content.replace("```", "")

        tasks = json.loads(content)

        saved_tasks = []

        best_user = select_best_user(db)
        for item in tasks:

            new_task = Task(
                project_id=project_id,
                assigned_to=best_user.user_id,
                title=item["title"],
                description=item["description"],
                priority=item["priority"]
            )

            db.add(new_task)

            saved_tasks.append({
                "title": item["title"],
                "priority": item["priority"],
                "assigned_to": best_user.name
            })

        db.commit()

        return saved_tasks

    except Exception as e:

        return {
            "error": str(e)
        }