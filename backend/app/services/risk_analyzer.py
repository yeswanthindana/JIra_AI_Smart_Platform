import app.services.ai_provider as ai_provider
from app.rag.search_service import search_similar_issues

#from langchain_community.llms import Ollama
#llm = OllamaLLM(model="qwen3:4b")

def analyze_risk(current_ticket):
    similar_issues = search_similar_issues(current_ticket)
    history = "\n".join([
        f"""
        Issue Key: {r.issue_key}
        Context ({r.chunk_type}):
        {r.content[:400]}
        """
        for r in similar_issues
    ])
    prompt = f"""
    You are a senior QA Architect.
    Current Jira Ticket:
    {current_ticket}
    Historical Similar Issues:
    {history}
    Analyze:
    1. Regression risks
    2. Impacted modules
    3. Possible failures
    4. High-risk areas
    5. Recommended testing areas
    6. Risk severity

    Provide detailed QA risk analysis.
    """
    
    return ai_provider.generate_response(prompt)