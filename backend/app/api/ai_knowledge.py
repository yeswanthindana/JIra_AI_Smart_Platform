import random
from app.services.rag_chat_service import llm

# Fallback in case LLM is offline
STATIC_KNOWLEDGE = [
    {
        "topic": "Embeddings",
        "description": "Mathematical representations of text meaning.",
        "practical": "Helps find 'bug' when you search 'issue'."
    }
]

def generate_llm_insight():
    """
    Asks the local LLM to generate a unique QA/AI insight.
    """
    topics = ["Embeddings", "RAG", "Vector Databases", "Prompt Engineering", "Semantic Search", "QA Automation", "Regression Testing"]
    topic = random.choice(topics)
    
    prompt = f"""
    Generate a short, professional educational snippet about {topic} in the context of AI-powered QA Engineering.
    Format your response EXACTLY like this:
    TOPIC: <one or two words>
    DESCRIPTION: <one concise sentence explaining the concept>
    PRACTICAL: <one short practical example or tip>
    
    Keep it very short and high-tech.
    """
    
    try:
        response = llm.invoke(prompt)
        
        # Parse response
        lines = response.strip().split("\n")
        data = {"topic": topic, "description": "", "practical": "", "is_llm": True}
        
        for line in lines:
            if line.startswith("TOPIC:"):
                data["topic"] = line.replace("TOPIC:", "").strip()
            elif line.startswith("DESCRIPTION:"):
                data["description"] = line.replace("DESCRIPTION:", "").strip()
            elif line.startswith("PRACTICAL:"):
                data["practical"] = line.replace("PRACTICAL:", "").strip()
        
        if not data["description"]:
            return None # Failed to generate meaningful content
            
        return data
    except Exception as e:
        print(f"LLM Insight Generation failed: {e}")
        return None
