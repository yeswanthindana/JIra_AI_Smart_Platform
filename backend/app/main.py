from fastapi import FastAPI
from app.integrations.jira_client import *
from app.services.testcase_generator import generate_testcases
from app.api.routes.ai_chat import router as ai_router
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psutil
try:
    import GPUtil
except ImportError:
    GPUtil = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)

class BugReport(BaseModel):
    project_key: str
    summary: str
    raw_data: str

class StatusUpdate(BaseModel):
    transition_name: str

@app.get("/")
def home():
    return {"message": "Jira RAG Service Running"}

@app.get("/system-info")
def get_system_info():
    cpu_usage = psutil.cpu_percent()
    ram_usage = psutil.virtual_memory().percent
    gpu_info = "N/A"
    if GPUtil:
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu_info = f"{gpus[0].load*100:.1f}%"
        except Exception:
            pass
    return {
        "model": "Qwen3:4b (Local)",
        "vector_db": "pgvector (PostgreSQL)",
        "status": "Healthy",
        "engine": "Ollama RAG Engine",
        "metrics": {"cpu": f"{cpu_usage}%", "ram": f"{ram_usage}%", "gpu": gpu_info}
    }

from app.api.ai_knowledge import generate_llm_insight
@app.get("/ai-knowledge")
def get_ai_knowledge():
    insight = generate_llm_insight()
    return {"status": "success", "data": insight} if insight else {"status": "error", "message": "LLM not connected"}

@app.get("/jira/{issue_key}")
def read_ticket(issue_key: str):
    issue = get_issue(issue_key)
    return {"summary": issue.fields.summary, "description": issue.fields.description}

@app.get("/generate-testcases/{issue_key}")
def generate(issue_key: str):
    issue = get_issue(issue_key)
    text = f"Summary:\n{issue.fields.summary}\nDescription:\n{issue.fields.description}"
    testcases = generate_testcases(text)
    return {"issue": issue_key, "testcases": testcases}

@app.post("/jira/{issue_key}/comment")
def comment(issue_key: str):
    issue = get_issue(issue_key)
    text = f"Summary:\n{issue.fields.summary}\nDescription:\n{issue.fields.description}"
    testcases = generate_testcases(text)
    add_comment(issue_key, testcases)
    return {"status": "comment added"}

from app.services.risk_analyzer import analyze_risk
@app.get("/risk-analysis/{issue_key}")
def risk(issue_key: str):
    issue = get_issue(issue_key)
    text = f"Summary: {issue.fields.summary}\nDescription: {issue.fields.description}"
    analysis = analyze_risk(text)
    return {"issue": issue_key, "analysis": analysis}

from app.services.bug_logger import refine_bug_report
@app.post("/jira/log-bug")
def log_bug(report: BugReport):
    refined_description = refine_bug_report(report.raw_data)
    new_issue = create_issue(report.project_key, report.summary, refined_description)
    return {"status": "success", "issue_key": new_issue.key, "description": refined_description}

@app.get("/jira/status-search")
def search_status(status: str):
    issues = get_issues_by_status(status)
    return [{"key": issue.key, "summary": issue.fields.summary, "status": issue.fields.status.name} for issue in issues]

@app.post("/jira/{issue_key}/status")
def change_status(issue_key: str, update: StatusUpdate):
    update_issue_status(issue_key, update.transition_name)
    return {"status": "success", "message": f"Issue {issue_key} transitioned to {update.transition_name}"}