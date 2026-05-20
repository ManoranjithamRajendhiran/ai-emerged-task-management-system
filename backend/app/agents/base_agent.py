from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import os

load_dotenv()

class BaseAgent:
    def __init__(self, system_prompt: str):
        # FIX: MODEL_NAME had no default — crashes if not set in .env
        self.llm = ChatGroq(
            groq_api_key=os.getenv("GROQ_API_KEY"),
            model_name=os.getenv("MODEL_NAME", "llama-3.1-8b-instant"),
            temperature=0.3
        )
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}")
        ])
        self.chain = self.prompt | self.llm

    def run(self, user_input: str):
        response = self.chain.invoke({"input": user_input})
        return response.content