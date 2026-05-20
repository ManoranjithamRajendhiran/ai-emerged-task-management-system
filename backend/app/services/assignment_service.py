from sqlalchemy.orm import Session
from app.models.user import User
from app.models.task import Task

def select_best_user(db: Session):
    users = db.query(User).all()
    best_user = None
    minimum_tasks = 9999
    for user in users:
        task_count = db.query(Task).filter(
            Task.assigned_to == user.user_id,
            Task.status != "COMPLETED"
        ).count()
        if task_count < minimum_tasks:
            minimum_tasks = task_count
            best_user = user
    return best_user

def select_best_user_for_task(task_title: str, task_description: str, team_members: list, db: Session):
    """Pick the best team member for a specific task based on skills and workload."""
    if not team_members:
        return select_best_user(db)
    
    best_user = None
    best_score = -1
    
    task_text = f"{task_title} {task_description}".lower()
    
    for user in team_members:
        # Skill match score
        skills = (user.skills or "").lower()
        github_summary = (user.github_summary or "").lower()
        combined_profile = f"{skills} {github_summary}"
        
        skill_score = 0
        keywords = task_text.replace(",", " ").split()
        for keyword in keywords:
            if len(keyword) > 3 and keyword in combined_profile:
                skill_score += 1
        
        # Workload score (fewer tasks = higher score)
        task_count = db.query(Task).filter(
            Task.assigned_to == user.user_id,
            Task.status != "COMPLETED"
        ).count()
        workload_score = max(0, 10 - task_count)
        
        total_score = (skill_score * 2) + workload_score
        
        if total_score > best_score:
            best_score = total_score
            best_user = user
    
    return best_user or team_members[0]