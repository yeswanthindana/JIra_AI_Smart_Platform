from app.services.ai_provider import llm, add_ai_stamp
from app.rag.search_service import search_similar_issues

# from langchain_ollama import OllamaLLM
# llm = OllamaLLM(model="qwen3:4b")

def generate_testcases(ticket_text):
    # 1. Get historical context from similar past issues
    similar_issues = search_similar_issues(ticket_text)
    
    history = "\n".join([
        f"- Past Issue [{r.issue_key}] ({r.chunk_type}):\n  Content: {r.content[:300]}..."
        for r in similar_issues
    ])

    prompt = f"""
    You are a Senior QA Architect. 
    Generate detailed, high-coverage test cases for the following new ticket.
    
    ----------------------------------------
    CURRENT TICKET:
    {ticket_text}
    ----------------------------------------
    
    HISTORICAL CONTEXT (Similar past issues and bugs):
    {history}
    ----------------------------------------

    Use the historical context to identify recurring failure patterns or specific areas that were buggy in the past.
    
    Include:
    - Positive scenarios (Happy path)
    - Negative scenarios (Error handling)
    - Boundary & Edge cases
    - Regression checks based on history
    - Security & Performance considerations
    
    Structure the response professionally.
    """
    
    response = llm.invoke(prompt)
    # return response
    return add_ai_stamp(response)
# from openai import OpenAI
# import os

# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# def generate_testcases(story):

#     prompt = f"""
#     Generate QA test cases for:

#     {story}

#     Include:
#     - Positive scenarios
#     - Negative scenarios
#     - API validations
#     - Edge cases
#     """

#     response = client.chat.completions.create(
#         model="gpt-5.5",
#         messages=[
#             {"role": "user", "content": prompt}
#         ]
#     )

#     return response.choices[0].message.content