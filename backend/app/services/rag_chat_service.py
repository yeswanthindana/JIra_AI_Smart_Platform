import app.services.ai_provider as ai_provider
from app.rag.search_service import search_similar_issues

# ------------------------------------------------
# RAG CHAT
# ------------------------------------------------

def ask_rag(question):
    results = search_similar_issues(question)
    context = "\n\n".join([
        f"""
        Issue Key: {r.issue_key}
        Chunk Type: {r.chunk_type}
        Content:
        {r.content}
        """
        for r in results
    ])

    prompt = f"""
    You are an expert QA Architect.
    Use the historical Jira knowledge below
    to answer the question.
    ----------------------------------------
    HISTORICAL JIRA KNOWLEDGE:
    {context}
    ----------------------------------------
    USER QUESTION:
    {question}
    ----------------------------------------
    Provide:
    1. Detailed analysis
    2. Historical patterns
    3. Risk insights
    4. Recommendations
    5. QA considerations
    """
    response = ai_provider.generate_response(prompt)
    
    return {
        "answer": response,
        "sources": [
            {
                "issue_key": r.issue_key,
                "chunk_type": r.chunk_type,
                "content": r.content[:300]
            }
            for r in results
        ]
    }

def ask_ticket_chat(issue_key, question, ticket_details):
    """
    Focused chat regarding a specific ticket.
    """
    rag_results = search_similar_issues(question)
    rag_context = "\n".join([f"[{r.issue_key}]: {r.content[:200]}" for r in rag_results])

    prompt = f"""
    You are a Senior Technical Lead. 
    You are currently analyzing JIRA TICKET: {issue_key}
    
    ----------------------------------------
    CURRENT TICKET DETAILS:
    {ticket_details}
    ----------------------------------------
    
    HISTORICAL CONTEXT (Similar issues):
    {rag_context}
    ----------------------------------------
    
    USER QUESTION ABOUT THIS TICKET:
    {question}
    
    Instructions:
    - Focus primarily on the Current Ticket Details.
    - Use Historical Context to provide deeper insights or comparisons.
    - Be precise and professional.
    """
    
    response = ai_provider.generate_response(prompt)
    
    return {
        "answer": response,
        "sources": [
             {"issue_key": r.issue_key, "chunk_type": r.chunk_type, "content": r.content[:200]}
             for r in rag_results
        ]
    }