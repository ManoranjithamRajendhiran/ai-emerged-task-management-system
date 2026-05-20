from app.agents.base_agent import BaseAgent

SYSTEM_PROMPT = """
You are an AI Task Assignment Agent.

Responsibilities:
- divide project into daily tasks
- prioritize tasks
- estimate deadlines
- identify dependencies

Always generate:
- task list
- priority
- estimated duration
"""

class TaskAgent(BaseAgent):

    def __init__(self):
        super().__init__(SYSTEM_PROMPT)

    def generate_tasks(self, project_data):
        return self.run(project_data)