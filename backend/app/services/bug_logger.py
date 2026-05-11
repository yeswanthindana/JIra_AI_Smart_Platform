from app.services.ai_provider import llm, add_ai_stamp

def refine_bug_report(raw_data: str):
    """
    Uses AI to structure a raw error log or description into a professional bug report.
    """
    prompt = f"""
    You are a Senior QA Engineer. 
    Transform the following raw input into a professional bug report structure (Summary, Steps, Actual, Expected).
    
    RAW INPUT:
    {raw_data}
    
    Professional Bug Report:
    """
    
    refined = llm.invoke(prompt)

    # stamp = "\n\n---\n✨ Logged via Local AI Qwen @ Jira AI Smart Platform"
    # return refined + stamp
    return add_ai_stamp(refined)
