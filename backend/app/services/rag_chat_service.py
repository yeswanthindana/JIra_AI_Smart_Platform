from app.services.ai_provider import llm, add_ai_stamp
from app.rag.search_service import (search_similar_issues)

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
    response = add_ai_stamp(llm.invoke(prompt))
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