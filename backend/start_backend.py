"""
Script to start the backend server
Run this from the backend directory
"""
import os
import sys
import subprocess

# Get the directory where this script is located (should be backend/)
script_dir = os.path.dirname(os.path.abspath(__file__))

# Ensure we're in the backend directory
os.chdir(script_dir)

print(f"Starting FastAPI server from: {script_dir}")
print("Server will be available at: http://localhost:8000")
print("API Documentation: http://localhost:8000/docs")
print("Press CTRL+C to stop the server")
print("-" * 50)

# Start uvicorn
subprocess.run([
    sys.executable, "-m", "uvicorn",
    "main:app",
    "--reload",
    "--port", "8000",
    "--host", "0.0.0.0"
])

