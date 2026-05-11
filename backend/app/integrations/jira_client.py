from jira import JIRA
import os
from dotenv import load_dotenv

load_dotenv()

jira = JIRA(
    server=os.getenv("JIRA_URL"),
    basic_auth=(
        os.getenv("JIRA_EMAIL"),
        os.getenv("JIRA_API_TOKEN")
    )
)

def get_issue(issue_key):
    return jira.issue(issue_key)

def add_comment(issue_key, comment):
    jira.add_comment(issue_key, comment)