#!/bin/bash

echo "======================================================"
echo " Starting Jira RAG Service Platform... "
echo "======================================================"

# 1. Start Docker Infrastructure
echo "Starting Docker (Postgres/Redis)..."
docker-compose up -d

# 2. Start Ollama (if not running)
if ! pgrep -x "ollama" > /dev/null
then
    echo "Starting Ollama..."
    ollama serve &
    sleep 5
fi

# 3. Start Backend
echo "Starting Backend..."
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
cd ..

# 4. Start Frontend
echo "Starting Frontend..."
cd frontend
npm run dev &
cd ..

echo ""
echo "======================================================"
echo " All services are starting up. "
echo " Dashboard: http://localhost:5173 "
echo " API:       http://localhost:8000 "
echo " Use ./stop_all.sh to terminate all services. "
echo "======================================================"
