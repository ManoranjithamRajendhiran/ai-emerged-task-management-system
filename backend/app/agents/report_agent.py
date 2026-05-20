from app.agents.base_agent import BaseAgent

SYSTEM_PROMPT = """
You are an AI Project Reporting Agent.

Generate:
- daily summaries
- weekly reports
- risk analysis
- progress reports

Keep reports concise and professional.
"""

class ReportAgent(BaseAgent):

    def __init__(self):
        super().__init__(SYSTEM_PROMPT)

    def generate_report(self, report_data):
        return self.run(report_data)