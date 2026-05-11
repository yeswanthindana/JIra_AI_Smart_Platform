#!/bin/bash

echo "======================================================"
echo " Pausing Jira RAG Service Platform... "
echo "======================================================"

# 1. Pause Docker Containers
echo "Pausing Docker containers..."
docker-compose pause || echo "Docker not running."

# 2. Suspend Local Processes
echo "Suspending local Backend and Frontend..."
pkill -STOP -f "uvicorn app.main:app"
pkill -STOP -f "vite"

echo ""
echo "======================================================"
echo " Services have been PAUSED. "
echo " GPU/CPU resources are now partially freed. "
echo " Use ./resume_all.sh to continue. "
echo "======================================================"
