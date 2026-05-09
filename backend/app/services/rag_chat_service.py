from langchain_ollama import OllamaLLM



from app.rag.search_service import (
    search_similar_issues
)

# ------------------------------------------------
# LOCAL AI MODEL
# ------------------------------------------------

llm = OllamaLLM(model="qwen3:4b")
# ------------------------------------------------
# RAG CHAT
# ------------------------------------------------

def ask_rag(question):

    # --------------------------------------------
    # SEARCH HISTORICAL CONTEXT
    # --------------------------------------------

    results = search_similar_issues(question)

    # --------------------------------------------
    # BUILD CONTEXT
    # --------------------------------------------

    context = "\n\n".join([

        f"""
        Issue Key: {r.issue_key}

        Chunk Type: {r.chunk_type}

        Content:
        {r.content}
        """

        for r in results

    ])

    # --------------------------------------------
    # PROMPT
    # --------------------------------------------

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

    # --------------------------------------------
    # AI RESPONSE
    # --------------------------------------------

    # response = llm.invoke(prompt)

    # return response
    for chunk in llm.stream(prompt):

        yield chunk
  