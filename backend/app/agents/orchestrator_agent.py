from app.agents.team_agent import TeamAgent
from app.agents.task_agent import TaskAgent
from app.agents.report_agent import ReportAgent
from app.agents.productivity_agent import ProductivityAgent
from app.agents.meeting_agent import MeetingAgent

class OrchestratorAgent:

    def __init__(self):

        self.team_agent = TeamAgent()
        self.task_agent = TaskAgent()
        self.report_agent = ReportAgent()
        self.productivity_agent = ProductivityAgent()
        self.meeting_agent = MeetingAgent()

    def handle_project_creation(self, project_details):

        print("Creating Team...")
        team = self.team_agent.create_team(project_details)

        print("Generating Tasks...")
        tasks = self.task_agent.generate_tasks(project_details)

        return {
            "team": team,
            "tasks": tasks
        }

    def handle_daily_report(self, report_data):

        return self.report_agent.generate_report(report_data)

    def handle_productivity(self, productivity_data):

        return self.productivity_agent.analyze_productivity(
            productivity_data
        )

    def handle_meeting(self, meeting_text):

        return self.meeting_agent.summarize_meeting(
            meeting_text
        )