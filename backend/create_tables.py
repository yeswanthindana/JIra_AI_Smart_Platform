from sqlalchemy import text
from app.database import Base, engine
from app.models.jira_vector import JiraVector
from app.models.jira_knowledge_chunk import JiraKnowledgeChunk


# Enable pgvector extension
with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    conn.commit()

Base.metadata.create_all(bind=engine)

print("Tables created successfully")