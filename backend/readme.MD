# 🧠 Jira RAG Service — Backend Architecture & Code Guide

Welcome to the **Ultimate Backend Guide** for the Jira RAG (Retrieval-Augmented Generation) Service. This document is designed for **everyone**—from total beginners to non-technical stakeholders—to understand exactly how this AI brain works, line by line.

---

## 🎯 The Ultimate Objective (For Non-Technical People)
Imagine you have a senior engineer who has memorized **every single Jira ticket** ever created in your company. 
- When you ask a question, they don't just guess; they instantly "search" their memory for similar past bugs.
- They then use that history to give you a perfect answer, generate test cases, or predict risks.

**This backend is that "Digital Senior Engineer."** It uses **Local AI** (so your data stays private) and a **Vector Database** (to act as the "Long-Term Memory").

---

## 🏗️ Backend Architecture Overview
The backend is built with **FastAPI** (a high-speed Python web framework). Here is how the data flows:

1.  **Jira Client**: Connects to your Jira Cloud and "fetches" tickets.
2.  **Embedding Engine**: Converts Jira text into "numbers" (Vectors) that the AI understands.
3.  **pgvector (Postgres)**: Stores these numbers in a specialized database for "Similarity Search."
4.  **RAG Service**: The orchestrator. It searches the memory, finds relevant history, and feeds it to the **Local LLM (Qwen3)**.
5.  **FastAPI Routes**: The "Doors" through which the Frontend talks to the AI.

---

## 📂 File-by-File Code Breakdown

### 1. `app/main.py` — The Front Door
This is the entry point of the application. It defines the "Routes" (URLs) that the frontend calls.

**Key Logic:**
- `@app.get("/system-info")`: Checks the health of the AI, CPU, and GPU.
- `@app.get("/ai-knowledge")`: Calls the AI to generate a "Did You Know?" tip.
- `@app.get("/generate-testcases/{issue_key}")`: Takes a Jira ID and returns AI-generated test steps.
- `@app.get("/risk-analysis/{issue_key}")`: Analyzes a ticket for historical regression risks.

### 2. `app/database.py` — The Connection Hub
This file tells the backend how to talk to the **PostgreSQL** database.
- `DATABASE_URL`: The "address" of the database (`localhost:5432`).
- `create_engine`: Opens the connection "pipe" to the data.

### 3. `app/integrations/jira_client.py` — The Jira Connector
This file authenticates the backend with Jira.
- It uses your **Jira URL**, **Email**, and **API Token** from the `.env` file.
- It provides a `get_issue()` function that can pull any ticket's data from the cloud in milliseconds.

### 4. `app/rag/embedding_service.py` — The "Translator"
This is one of the most important files. It converts English text into math.
- **Line 5**: Uses the `all-minilm` model to create embeddings.
- **Line 7 (`generate_embedding`)**: Takes text like "Login is slow" and turns it into a list of 384 numbers.
- **Why?** Because computers can compare numbers (vectors) much faster than they can compare words.

### 5. `app/rag/search_service.py` — The "Memory Searcher"
This file searches the database for "Similar" items.
- **Line 10 (SQL Query)**: Uses a special operator `<->` (Cosine Distance).
- **The Logic**: It says "Find me the 5 tickets in the database whose 'numbers' are closest to the user's question."

### 6. `app/services/rag_chat_service.py` — The "Orchestrator"
This is the brain that puts everything together.
- **Line 11 (`ask_rag`)**: 
    1.  First, it calls `search_similar_issues` to find history.
    2.  It builds a "Context" string containing that history.
    3.  It creates a **Prompt**: "You are an expert. Here is some history [Context]. Now answer this [Question]."
    4.  It calls the **Local LLM** (`llm.invoke`) and returns the final answer.

---

## 🚀 How to Run the Backend

### Option A: Local Run (Development)
1.  **Activate Environment**: 
    ```bash
    source .venv/bin/activate
    ```
2.  **Install Dependencies**: 
    ```bash
    pip install -r requirements.txt
    ```
3.  **Run with Auto-Reload**:
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```

### Option B: Docker Run (Production Grade)
1.  **Build and Start**:
    ```bash
    docker-compose up -d --build
    ```
    *This starts the DB, Redis, Ollama, Backend, and Frontend all at once.*

---

## 📖 Key Concepts for Beginners

### What is RAG?
**Retrieval-Augmented Generation**. 
Think of it as an "Open Book Exam." 
- **Standard AI**: Tries to answer from memory (might lie/hallucinate).
- **RAG AI**: Looks at the "Book" (your Jira history) first, then answers based on the facts it found.

### What is pgvector?
A plugin for the Postgres database that allows it to store and search "Vectors" (AI numbers). It makes finding "similar" text extremely fast.

### Why Local AI (Ollama)?
By running **Qwen3:4b** locally:
1.  **Privacy**: Your Jira tickets never leave your server.
2.  **Cost**: $0 per request.
3.  **Speed**: No latency from external internet APIs.

---

## 🛠️ Database & Infrastructure Setup

Choose one of the following methods to set up your vector database and cache.

### Option A: Using Docker (Recommended)
This is the fastest way to get the specialized `pgvector` database and Redis running:

```bash
# 1. Start pgvector
docker run -d --name qa_postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=qa_ai -p 5432:5432 pgvector/pgvector:pg16

# 2. Start Redis
docker run -d --name qa_redis -p 6379:6379 redis:7

# 3. Initialize the tables
python3 create_tables.py
```

### Option B: Manual Machine Setup (Ubuntu - No Docker)

If you prefer to run the infrastructure directly on your machine, follow these steps for Ubuntu 24.04+.

#### 1. PostgreSQL & pgvector Setup
Ubuntu 24.04 includes `pgvector` in its official repositories.

```bash
# Update and install
sudo apt update
sudo apt install -y postgresql-16 postgresql-16-pgvector

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create Database and User (matching .env defaults)
sudo -u postgres psql <<EOF
ALTER USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE qa_ai;
\c qa_ai
CREATE EXTENSION IF NOT EXISTS vector;
EOF
```

#### 2. Redis Setup
```bash
# Install Redis server
sudo apt install -y redis-server

# Start and enable service
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### 3. Initialize Application Tables
Once the services are running, run the initialization script from the `backend` folder:
```bash
python3 create_tables.py
```

#### 4. Configuration Adjustment
Update your `.env` file to point to `localhost` instead of the Docker service names:
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qa_ai`
- `REDIS_HOST=localhost`

---

## 🔍 Deep Dive: How `create_tables.py` works

For those who want to understand the code-level magic, here is exactly how this script sets up your database:

### 1. The "Memory Scanner" (Metadata)
At the top of the script, we import `Base` from `app.database`. 
- `Base` is a **Declarative Base**. Think of it as a "Registry." 
- When we import our models (like `JiraVector` and `JiraKnowledgeChunk`), they automatically "register" themselves with `Base`.

### 2. Enabling AI Support (Raw SQL)
Before creating tables, the script connects to Postgres and runs:
```sql
CREATE EXTENSION IF NOT EXISTS vector
```
This is a "Raw SQL" command. It tells Postgres: "Hey, prepare yourself to handle AI math (vectors)." Without this, the database wouldn't understand the `VECTOR` column type.

### 3. The "Translator" (`create_all`)
The most important line is `Base.metadata.create_all(bind=engine)`.
- **`Base.metadata`**: This is a collection of all the table designs the AI found while scanning the `models/` folder.
- **`create_all`**: This function is a translator. It looks at your Python code and translates it into SQL commands that Postgres understands.
- **`bind=engine`**: This is the "Pipe." It tells SQLAlchemy which specific database to send those commands to.

### 4. The Result
If a table doesn't exist, it is created exactly as defined in your Python models. If it already exists, SQLAlchemy safely skips it.

---

## 🛠️ Project Structure at a Glance
```text
backend/
├── app/
│   ├── api/          # Route handlers & Knowledge logic
│   ├── integrations/ # External APIs (Jira)
│   ├── rag/          # Embeddings & Vector Search
│   ├── services/     # AI Logic (Chat, Risk, TestCases)
│   ├── database.py   # DB Connection
│   └── main.py       # API Entry Point
├── Dockerfile        # Container recipe
├── requirements.txt  # Python libraries
└── index_full_jira.py # Script to "teach" the AI your project
```

---
**Ultimate Goal Accomplished**: You now understand the full lifecycle of a request—from the moment you click "Ask" on the frontend to the moment the AI retrieves historical context from the vector database and generates a high-precision response.
