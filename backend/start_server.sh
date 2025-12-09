#!/bin/bash
cd "$(dirname "$0")"
echo "Starting FastAPI server from backend directory..."
echo "Server will be available at: http://localhost:8000"
echo ""
python -m uvicorn main:app --reload --port 8000


