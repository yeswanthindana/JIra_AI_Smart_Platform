#!/bin/bash

echo "======================================================"
echo " Stopping Jira RAG Service Components... "
echo "======================================================"

# 1. Unpause everything (mandatory before killing)
echo "Unpausing all containers to allow termination..."
docker-compose unpause 2>/dev/null || echo "Nothing to unpause."

# 2. Stop Backend (Uvicorn)
echo "Force stopping Backend..."
pkill -9 -f "uvicorn app.main:app" || echo "Backend was not running."

# 3. Stop Frontend (Vite)
echo "Force stopping Frontend..."
pkill -9 -f "vite" || echo "Frontend was not running."

# 4. Stop Ollama
echo "Force stopping Ollama AI Engine..."
sudo pkill -9 ollama || echo "Ollama was not running."

# 5. Force Stop Docker Containers
echo "Force removing Docker infrastructure..."
docker-compose down -v --remove-orphans || echo "Docker containers were not running."
docker rm -f qa_postgres_new qa_redis qa_postgres 2>/dev/null || echo "Containers already removed."

echo ""
echo "======================================================"
echo " All services have been terminated. "
echo "======================================================"
