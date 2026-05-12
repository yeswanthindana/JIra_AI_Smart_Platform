import app.services.ai_provider as ai_provider
from app.rag.search_service import search_similar_issues

# ------------------------------------------------
# RAG CHAT
# ------------------------------------------------

def ask_rag(question):
    results = search_similar_issues(question)
    context = "\n\n".join([f"[{r.issue_key}]: {r.content}" for r in results])

    prompt = f"""
    You are a highly skilled Senior Technical Lead and QA Architect. 
    A user is asking you a question about the project based on historical Jira data.
    
    ### HISTORICAL CONTEXT:
    {context}
    
    ### USER QUESTION:
    {question}
    
    ### INSTRUCTIONS:
    - Respond in a professional, helpful, and "human" tone. 
    - Don't just list facts; provide analysis and connections between issues if applicable.
    - If you don't know the answer based on the context, say so gracefully.
    - Use Markdown for structure but keep it conversational.
    """
    response = ai_provider.generate_response(prompt)
    
    return {
        "answer": response,
        "sources": [{"issue_key": r.issue_key, "chunk_type": r.chunk_type, "content": r.content[:300]} for r in results]
    }

def stream_rag(question):
    results = search_similar_issues(question)
    context = "\n\n".join([f"[{r.issue_key}]: {r.content}" for r in results])
    prompt = f"Context: {context}\n\nQuestion: {question}\n\nAnswer in a conversational, professional tone as a Senior Lead."
    return ai_provider.stream_response(prompt)

def ask_ticket_chat(issue_key, question, ticket_details):
    rag_results = search_similar_issues(question)
    rag_context = "\n".join([f"[{r.issue_key}]: {r.content[:300]}" for r in rag_results])

    prompt = f"""
    You are an expert Engineer helping a teammate. Use standard JIRA WIKI MARKUP.
    
    ### CURRENT TICKET: {issue_key}
    {ticket_details}
    
    ### HISTORY: {rag_context}
    ### QUESTION: {question}
    
    ### JIRA FORMATTING:
    - Headers: 'h3. Header'
    - Bold: '*text*'
    - Lists: '* ' or '# '
    - Tables: '||Header||' and '|Cell|'
    """
    response = ai_provider.generate_response(prompt)
    return {
        "answer": response,
        "sources": [{"issue_key": r.issue_key, "chunk_type": r.chunk_type, "content": r.content[:200]} for r in rag_results]
    }

def stream_ticket_chat(issue_key, question, ticket_details):
    rag_results = search_similar_issues(question)
    rag_context = "\n".join([f"[{r.issue_key}]: {r.content[:300]}" for r in rag_results])
    prompt = f"Analyze {issue_key} with history: {rag_context}. Ticket info: {ticket_details}. Question: {question}. Respond naturally."
    return ai_provider.stream_response(prompt)