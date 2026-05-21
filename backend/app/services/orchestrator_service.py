from sqlalchemy.orm import Session
from app.services.task_service import generate_tasks
from app.services.report_service import generate_report

def run_project_workflow(db: Session, project_title: str, project_id: str):
    print("ORCHESTRATOR STARTED")

    # Step 1 — Generate and assign tasks using AI
    generated_tasks = generate_tasks(project_title, project_id, db)
    print("TASKS GENERATED")

    # Step 2 — Generate full project report
    report = generate_report(db)
    print("REPORT GENERATED")

    return {
        "generated_tasks": generated_tasks,
        "report": report,
        "workflow_status": "completed",
        "steps_completed": ["task_generation", "report_generation"]
    }