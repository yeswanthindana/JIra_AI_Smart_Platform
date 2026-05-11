from sqlalchemy import text
from app.database import SessionLocal
from app.rag.embedding_service import generate_embedding

db = SessionLocal()

def search_similar_issues(query):

    embedding = generate_embedding(query)
    sql = text("""
        SELECT
            issue_key,
            chunk_type,
            content,
            embedding <-> CAST(:embedding AS vector) AS distance
        FROM jira_knowledge_chunks
        ORDER BY distance
        LIMIT 5;
    """)
    results = db.execute(
        sql,
        {"embedding": str(embedding)}
    )
    return results.fetchall()