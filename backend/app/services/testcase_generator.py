import app.services.ai_provider as ai_provider
from app.rag.search_service import search_similar_issues

# from langchain_ollama import OllamaLLM
# llm = OllamaLLM(model="qwen3:4b")

def get_testcase_prompt(ticket_text, history):
    return f"""
    You are a Senior QA Engineer. Generate a PRODUCTION-GRADE testing report.
    Use ONLY JIRA WIKI MARKUP. 
    
    ### STRICT UI RULES:
    1. Use {{panel:title=SECTION_NAME|titleBGColor=#f4f5f7|borderStyle=solid}} for each main section.
    2. Start each panel with a clear 'h2. Title' inside.
    3. NO NESTING. No 'a.' or 'i.'. Use '*' for bullets.
    4. NO INDENTATION. Start everything at the left.
    5. Bold text using '*bold*'.
    
    ### CONTENT:
    - Ticket: {ticket_text}
    - Context: {history}
    """

def generate_testcases(ticket_text):
    similar_issues = search_similar_issues(ticket_text)
    history = "\n".join([f"[{r.issue_key}]: {r.content[:300]}" for r in similar_issues])
    return ai_provider.generate_response(get_testcase_prompt(ticket_text, history))

def stream_testcases(ticket_text):
    similar_issues = search_similar_issues(ticket_text)
    history = "\n".join([f"[{r.issue_key}]: {r.content[:300]}" for r in similar_issues])
    return ai_provider.stream_response(get_testcase_prompt(ticket_text, history))
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