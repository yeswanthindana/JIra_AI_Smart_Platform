from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    UniqueConstraint
)

from pgvector.sqlalchemy import Vector

from app.database import Base


class JiraKnowledgeChunk(Base):

    __tablename__ = "jira_knowledge_chunks"

    __table_args__ = (

        UniqueConstraint(

            'issue_key',

            'chunk_type',

            'content_hash',

            name='unique_jira_chunk'

        ),
    )

    id = Column(Integer, primary_key=True)

    issue_key = Column(String)

    chunk_type = Column(String)

    content = Column(Text)

    content_hash = Column(String)

    embedding = Column(Vector(384))