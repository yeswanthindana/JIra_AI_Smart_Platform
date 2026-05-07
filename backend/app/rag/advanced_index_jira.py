from app.database import SessionLocal

from app.models.jira_knowledge_chunk import JiraKnowledgeChunk

from app.rag.embedding_service import generate_embedding

db = SessionLocal()

def store_chunk(issue_key, chunk_type, content):

    if not content:
        return

    embedding = generate_embedding(content)

    chunk = JiraKnowledgeChunk(
        issue_key=issue_key,
        chunk_type=chunk_type,
        content=content,
        embedding=embedding
    )

    existing = db.query(JiraKnowledgeChunk).filter_by(
    issue_key=issue_key,
    chunk_type=chunk_type,
    content=content
    ).first()

    if existing:
        print(f"Skipping duplicate {chunk_type} for {issue_key}")
        return

    db.add(chunk)

    db.commit()

    print(f"Stored {chunk_type} for {issue_key}")