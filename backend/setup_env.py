"""
Script to help set up the .env file for the backend
"""
import os

def setup_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    
    print("=" * 60)
    print("SmartSign Backend - Environment Setup")
    print("=" * 60)
    print()
    
    if os.path.exists(env_path):
        print("⚠️  .env file already exists!")
        overwrite = input("Do you want to overwrite it? (y/n): ").lower()
        if overwrite != 'y':
            print("Setup cancelled.")
            return
    
    print("\n📝 Please provide the following information:\n")
    
    # Get OpenAI API key
    print("1. OpenAI API Key (for AI interpretation with GPT-4o-mini)")
    print("   Get it from: https://platform.openai.com/api-keys")
    openai_key = input("   Enter your OpenAI API key: ").strip()
    
    if not openai_key:
        print("\n⚠️  Warning: No OpenAI API key provided.")
        print("   The system will use fallback mode (simple word mapping)")
        use_fallback = input("   Continue without AI? (y/n): ").lower()
        if use_fallback != 'y':
            print("Setup cancelled.")
            return
        openai_key = ""
    
    # Roboflow API key (already configured)
    print("\n2. Roboflow API Key (already configured)")
    roboflow_key = input("   Press Enter to use default or enter custom key: ").strip()
    if not roboflow_key:
        roboflow_key = "PfNLBY9FSfXGfx9lccYk"
    
    # Create .env file
    env_content = f"""# OpenAI API Key for AI interpretation (GPT-4o-mini)
OPENAI_API_KEY={openai_key}

# Roboflow API Key for sign language detection
ROBOFLOW_API_KEY={roboflow_key}
"""
    
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print("\n" + "=" * 60)
    print("✅ .env file created successfully!")
    print("=" * 60)
    print(f"\nFile location: {env_path}")
    print("\nYou can now start the backend server:")
    print("  python start_backend.py")
    print("\nOr:")
    print("  uvicorn main:app --reload --port 8000")
    print()

if __name__ == "__main__":
    try:
        setup_env()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user.")
    except Exception as e:
        print(f"\n❌ Error: {e}")

