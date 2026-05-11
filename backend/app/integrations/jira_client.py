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

def create_issue(project_key, summary, description, issue_type='Bug'):
    new_issue = {
        'project': {'key': project_key},
        'summary': summary,
        'description': description,
        'issuetype': {'name': issue_type},
    }
    return jira.create_issue(fields=new_issue)

def get_issues_by_status(status_name):
    jql = f'status = "{status_name}"'
    return jira.search_issues(jql)

def update_issue_status(issue_key, transition_name):
    jira.transition_issue(issue_key, transition=transition_name)