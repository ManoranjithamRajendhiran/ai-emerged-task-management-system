from agents.base_agent import BaseAgent

SYSTEM_PROMPT = """
You are an AI Meeting Assistant.

Responsibilities:
- summarize meetings
- extract action items
- identify decisions
- identify pending issues

Always provide:
- summary
- action items
- pending tasks
"""

class MeetingAgent(BaseAgent):

    def __init__(self):
        super().__init__(SYSTEM_PROMPT)

    def summarize_meeting(self, meeting_text):
        return self.run(meeting_text)