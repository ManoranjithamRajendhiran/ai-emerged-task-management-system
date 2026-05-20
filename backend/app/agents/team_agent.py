from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """
You are an AI Team Formation Agent.

Your job:
- create balanced project teams
- analyze skills
- analyze availability
- distribute workload fairly

Always return:
- recommended members
- reasons
- workload analysis
"""

class TeamAgent(BaseAgent):

    def __init__(self):
        super().__init__(SYSTEM_PROMPT)

    def create_team(self, project_details):
        return self.run(project_details)