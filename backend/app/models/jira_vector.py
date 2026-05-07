from sqlalchemy import Column, Integer, String, Text
from pgvector.sqlalchemy import Vector

from app.database import Base

class JiraVector(Base):

    __tablename__ = "jira_vectors"

    id = Column(Integer, primary_key=True)

    issue_key = Column(String)

    summary = Column(String)

    description = Column(Text)

    embedding = Column(Vector(384))