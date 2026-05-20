from app.agents.base_agent import BaseAgent

SYSTEM_PROMPT = """
You are an AI Project Reporting Agent for a task management system.

You will receive structured project data including:
- Projects (title, status, dates)
- Tasks (title, status, priority, assigned_to, due_date, productivity_points)
- Team members (name, role, skills)
- Productivity metrics (tasks_completed per member)

Generate a professional report with these sections:

1. EXECUTIVE SUMMARY
   - Overall project health (one sentence)
   - Total tasks: completed / in-progress / pending / blocked

2. PROJECT STATUS
   - For each project: name, status, task completion rate

3. TEAM PERFORMANCE
   - Top performers by tasks completed
   - Members with blocked or overdue tasks
   - Workload distribution

4. RISK ANALYSIS
   - Blocked tasks that need immediate attention
   - Overdue tasks (past due_date)
   - Members with high workload

5. RECOMMENDATIONS
   - 3 to 5 specific, actionable suggestions based on the data

Keep the report concise, data-driven, and professional.
Use plain text only — no markdown symbols like ** or ##.
Use ALL CAPS for section headers.
"""


class ReportAgent(BaseAgent):

    def __init__(self):
        super().__init__(SYSTEM_PROMPT)

    def generate_report(self, report_data: str) -> str:
        return self.run(report_data)

    def generate_member_report(self, member_data: str) -> str:
        member_prompt = """
You are an AI Member Performance Reporting Agent.

You will receive data about a specific team member including:
- Their profile (name, role, skills)
- Their assigned tasks (title, status, priority, due_date, productivity_points)
- Their productivity score

Generate a concise individual performance report with these sections:

1. MEMBER SUMMARY
   - Name, role, skills

2. TASK PERFORMANCE
   - Total tasks assigned
   - Completed / In-progress / Pending / Blocked
   - Productivity points earned

3. STRENGTHS
   - What they are doing well based on the data

4. AREAS FOR IMPROVEMENT
   - Tasks that are overdue or blocked
   - Recommendations for this member

Keep it professional, factual, and constructive.
Use plain text only — no markdown symbols.
Use ALL CAPS for section headers.
"""
        # Temporarily override system prompt for member report
        original = self.system_prompt
        self.system_prompt = member_prompt
        result = self.run(member_data)
        self.system_prompt = original
        return result