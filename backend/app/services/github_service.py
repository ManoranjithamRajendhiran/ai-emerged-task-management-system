import requests
import os
from dotenv import load_dotenv

load_dotenv()

def fetch_github_summary(github_url: str) -> str:
    try:
        if not github_url:
            return ""
        
        username = github_url.rstrip("/").split("/")[-1]

        repos_resp = requests.get(
            f"https://api.github.com/users/{username}/repos?sort=updated&per_page=10",
            headers={"Accept": "application/vnd.github.v3+json"},
            timeout=5
        )

        if repos_resp.status_code != 200:
            return f"GitHub user: {username}"

        repos = repos_resp.json()
        languages = []
        for r in repos:
            if r.get("language") and r["language"] not in languages:
                languages.append(r["language"])

        lang_text = ", ".join(languages[:6]) or "various technologies"
        return f"Works with {lang_text} based on GitHub repositories."

    except Exception:
        return ""