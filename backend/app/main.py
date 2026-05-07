from fastapi import FastAPI
from app.integrations.jira_client import *
from app.services.testcase_generator import generate_testcases

app = FastAPI()

@app.get("/")
def health():
    return {"status":"Running"}


@app.get("/jira/{issue_key}")
def read_ticket(issue_key: str):

    issue = get_issue(issue_key)

    return {
        "summary": issue.fields.summary,
        "description": issue.fields.description
    }


@app.get("/generate-testcases/{issue_key}")
def generate(issue_key: str):

    issue = get_issue(issue_key)

    text = f"""
    Summary:
    {issue.fields.summary}

    Description:
    {issue.fields.description}
    """

    testcases = generate_testcases(text)

    return {
        "issue": issue_key,
        "testcases": testcases
    }

@app.post("/jira/{issue_key}/comment")
def comment(issue_key: str):

    issue = get_issue(issue_key)

    text = f"""
    Summary:
    {issue.fields.summary}

    Description:
    {issue.fields.description}
    """

    testcases = generate_testcases(text)

    add_comment(issue_key, testcases)

    return {"status": "comment added"}