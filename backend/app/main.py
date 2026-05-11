from fastapi import FastAPI
from app.integrations.jira_client import *
from app.services.testcase_generator import generate_testcases
from app.api.routes.ai_chat import router as ai_router
from fastapi.middleware.cors import (
    CORSMiddleware
)


app = FastAPI()

app.add_middleware(

    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)

app.include_router(ai_router)

# @app.get("/")
# def health():
#     return {"status":"Running"}


import psutil
try:
    import GPUtil
except ImportError:
    GPUtil = None

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
        "source": "Jira Cloud",
        "status": "Healthy",
        "engine": "Ollama RAG Engine",
        "metrics": {
            "cpu": f"{cpu_usage}%",
            "ram": f"{ram_usage}%",
            "gpu": gpu_info
        }
    }

from app.api.ai_knowledge import generate_llm_insight

@app.get("/ai-knowledge")
def get_ai_knowledge():
    insight = generate_llm_insight()
    if insight:
        return {"status": "success", "data": insight}
    return {"status": "error", "message": "LLM not connected"}

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

from app.services.risk_analyzer import analyze_risk

@app.get("/risk-analysis/{issue_key}")
def risk(issue_key: str):
    issue = get_issue(issue_key)
    text = f"Summary: {issue.fields.summary}\nDescription: {issue.fields.description}"
    analysis = analyze_risk(text)
    return {
        "issue": issue_key,
        "analysis": analysis
    }