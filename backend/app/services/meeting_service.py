from langchain_groq import ChatGroq

from dotenv import load_dotenv

import os

load_dotenv()


def summarize_meeting(transcript):

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        groq_api_key=os.getenv("GROQ_API_KEY")
    )

    prompt = f"""
    Analyze this meeting transcript.

    Transcript:
    {transcript}

    Generate:
    1. Meeting Summary
    2. Action Items
    3. Important Decisions
    4. Deadlines
    5. Assigned Responsibilities

    Return clean structured text.
    """

    response = llm.invoke(prompt)

    return response.content