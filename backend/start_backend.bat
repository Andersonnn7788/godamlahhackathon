@echo off
cd /d "%~dp0"
echo Starting FastAPI server from backend directory...
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo Press CTRL+C to stop the server
echo --------------------------------------------------
echo.
python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0


