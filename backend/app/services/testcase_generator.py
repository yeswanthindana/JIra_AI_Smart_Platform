from langchain_ollama import OllamaLLM
llm = OllamaLLM(model="qwen3:4b")

def generate_testcases(story):
    prompt = f"""
    Generate detailed QA test cases for:
    {story}
    Include:
    - Positive scenarios
    - Negative scenarios
    - API validations
    - Edge cases
    - Security checks
    """
    response = llm.invoke(prompt)
    return response
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