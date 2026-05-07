from app.database import Base, engine
from app.models.jira_vector import JiraVector

Base.metadata.create_all(bind=engine)

print("Tables created successfully")