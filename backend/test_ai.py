"""
Test script to verify OpenAI GPT-4o-mini integration
"""
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

def test_ai_setup():
    print("=" * 50)
    print("Testing OpenAI GPT-4o-mini Integration")
    print("=" * 50)
    
    # Check if API key is loaded
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY not found in environment")
        print("   Make sure you have a .env file with your API key")
        return False
    
    print(f"✅ API key loaded: {api_key[:20]}...")
    
    # Test OpenAI client initialization
    try:
        client = OpenAI(api_key=api_key)
        print("✅ OpenAI client initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize OpenAI client: {e}")
        return False
    
    # Test AI interpretation
    try:
        print("\n🤖 Testing AI interpretation...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=50,
            messages=[{
                "role": "user",
                "content": "Convert this sign language word into a natural sentence: help"
            }]
        )
        
        interpretation = response.choices[0].message.content.strip()
        print(f"✅ AI Response: '{interpretation}'")
        return True
        
    except Exception as e:
        print(f"❌ AI interpretation failed: {e}")
        return False

if __name__ == "__main__":
    success = test_ai_setup()
    if success:
        print("\n🎉 AI integration is working correctly!")
    else:
        print("\n💡 Fix the issues above and try again.")
