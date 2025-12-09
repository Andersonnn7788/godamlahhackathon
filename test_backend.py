#!/usr/bin/env python3
"""
Quick test script to verify the backend is working
"""

import requests
import time

def test_backend():
    """Test backend endpoints"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Backend Endpoints...")
    print("=" * 50)
    
    # Test 1: Health Check
    try:
        print("1️⃣ Testing /health endpoint...")
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Health check passed: {data['status']}")
            print(f"   📊 Features: {data.get('features', {})}")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
    
    print()
    
    # Test 2: Models endpoint
    try:
        print("2️⃣ Testing /models endpoint...")
        response = requests.get(f"{base_url}/models", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Models endpoint works")
            print(f"   📊 Available models: {len(data.get('models', []))}")
        else:
            print(f"   ❌ Models endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Models endpoint error: {e}")
    
    print()
    
    # Test 3: API Documentation
    try:
        print("3️⃣ Testing /docs endpoint...")
        response = requests.get(f"{base_url}/docs", timeout=10)
        if response.status_code == 200:
            print(f"   ✅ API docs accessible")
            print(f"   🌐 Visit: {base_url}/docs")
        else:
            print(f"   ❌ API docs failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ API docs error: {e}")
    
    print()
    print("=" * 50)
    print("🎯 Backend Test Complete!")
    print()
    print("If all tests passed, the backend is ready!")
    print("If tests failed, check:")
    print("  - Backend is running: python start_backend.py")
    print("  - Port 8000 is not blocked")
    print("  - MediaPipe dependencies are installed")

if __name__ == "__main__":
    test_backend()
