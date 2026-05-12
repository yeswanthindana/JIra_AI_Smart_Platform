import app.services.ai_provider as ai_provider
from app.rag.search_service import search_similar_issues

def get_risk_prompt(current_ticket, history):
    return f"""
    You are a Senior QA Lead. Provide a technical risk assessment.
    Use ONLY JIRA WIKI MARKUP for a PRODUCTION-GRADE report.
    
    ### UI ENFORCEMENT:
    1. Wrap each major area (Summary, Risks, Recommendations) in:
       {{panel:title=TITLE|titleBGColor=#f4f5f7|borderStyle=solid}}
       Content...
       {{panel}}
    2. Inside the panel, use 'h2. Section Title' for the heading.
    3. NO INDENTATION. All text must be at the left margin within the panel.
    4. NO NESTING. No '1. a. i.' patterns. Use simple '*' bullets.
    5. Tables: Use '||Header||Header||' for risks.
    
    ### DATA:
    - Ticket: {current_ticket}
    - History: {history}
    """

def analyze_risk(current_ticket):
    similar_issues = search_similar_issues(current_ticket)
    history = "\n".join([f"[{r.issue_key}]: {r.content[:300]}" for r in similar_issues])
    return ai_provider.generate_response(get_risk_prompt(current_ticket, history))

def stream_risk_analysis(current_ticket):
    similar_issues = search_similar_issues(current_ticket)
    history = "\n".join([f"[{r.issue_key}]: {r.content[:300]}" for r in similar_issues])
    return ai_provider.stream_response(get_risk_prompt(current_ticket, history))