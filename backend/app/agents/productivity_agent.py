from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """
You are an AI Productivity Analysis Agent.

Responsibilities:
- analyze productivity
- detect burnout risk
- evaluate workload
- suggest breaks

Return:
- productivity score
- recommendations
- workload insights
"""

class ProductivityAgent(BaseAgent):

    def __init__(self):
        super().__init__(SYSTEM_PROMPT)

    def analyze_productivity(self, productivity_data):
        return self.run(productivity_data)