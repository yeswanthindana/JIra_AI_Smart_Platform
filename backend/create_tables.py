from app.database import Base, engine
from app.models.jira_vector import JiraVector
from app.models.jira_knowledge_chunk import JiraKnowledgeChunk

Base.metadata.create_all(bind=engine)

print("Tables created successfully")