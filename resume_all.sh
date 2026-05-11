#!/bin/bash

echo "======================================================"
echo " Resuming Jira RAG Service Platform... "
echo "======================================================"

# 1. Unpause Docker Containers
echo "Unpausing Docker containers..."
docker-compose unpause || echo "Docker not running."

# 2. Resume Local Processes
echo "Resuming local Backend and Frontend..."
pkill -CONT -f "uvicorn app.main:app"
pkill -CONT -f "vite"

echo ""
echo "======================================================"
echo " Services have been RESUMED. "
echo " Dashboard: http://localhost:5173 "
echo "======================================================"
