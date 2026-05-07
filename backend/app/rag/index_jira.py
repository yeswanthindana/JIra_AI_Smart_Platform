from app.database import SessionLocal
from app.models.jira_vector import JiraVector
from app.rag.embedding_service import generate_embedding

def store_jira_issue(issue_key, summary, description):

    text = f"""
    Summary:
    {summary}

    Description:
    {description}
    """

    print(f"Generating embedding for issue {issue_key}...")
    embedding = generate_embedding(text)
    print(f"Embedding generated for issue {issue_key}.")
    db = SessionLocal()
    try:
        jira_vector = JiraVector(
            issue_key=issue_key,
            summary=summary,
            description=description,
            embedding=embedding
        )

        db.add(jira_vector)
        db.commit()
        print(f"Stored Jira issue: {issue_key}")
    except Exception as e:
        db.rollback()
        print(f"Error storing Jira issue {issue_key}: {e}")
    finally:
        db.close()