from sqlalchemy.orm import Session

from app.services.task_service import (
    generate_tasks
)

from app.services.report_service import (
    generate_report
)


def run_project_workflow(
    db: Session,
    project_title,
    project_id
):

    print("ORCHESTRATOR STARTED")

    # STEP 1
    generated_tasks = generate_tasks(
        project_title,
        project_id,
        db
    )

    print("TASKS GENERATED")

    # STEP 2
    report = generate_report(db)

    print("REPORT GENERATED")

    return {
        "generated_tasks": generated_tasks,
        "report": report
    }