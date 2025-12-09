"""
Quick restart script for the backend server
"""
import os
import sys
import subprocess
import time

def restart_server():
    print("🔄 Restarting Backend Server with Hybrid Detector")
    print("=" * 50)
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print("📍 Working directory:", script_dir)
    print("🚀 Starting FastAPI server with hybrid detector...")
    print("📡 Server will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("⚡ New fast endpoint: /sign-to-text-fast")
    print("🤖 AI Model: GPT-4o-mini")
    print("👋 MediaPipe + Roboflow hybrid detection enabled")
    print("-" * 50)
    
    try:
        # Start uvicorn with the updated main.py
        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--reload",
            "--port", "8000",
            "--host", "0.0.0.0"
        ])
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    restart_server()
