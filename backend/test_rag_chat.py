from app.services.rag_chat_service import (
    ask_rag
)

question = """
What are common Vision Engine
detection failures observed historically?
"""

response = ask_rag(question)

print("\n========== AI RESPONSE ==========\n")

print(response)