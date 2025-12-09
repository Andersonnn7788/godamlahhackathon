# Setup Guide: AI-Powered Sign Language Recognition

## 🚀 Quick Setup

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install:
- `openai` - For AI interpretation using GPT-4o-mini
- `python-dotenv` - For environment variable management
- All existing dependencies (fastapi, uvicorn, etc.)

### 2. Configure OpenAI API Key

Create a `.env` file in the `backend/` directory:

```bash
# backend/.env
OPENAI_API_KEY=your_actual_openai_api_key_here
ROBOFLOW_API_KEY=PfNLBY9FSfXGfx9lccYk
```

**To get your OpenAI API key:**
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the API key
5. Paste it into the `.env` file

### 3. Start the Backend

```bash
cd backend
python start_backend.py
```

Or:

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

## 🎯 How It Works

### Real-Time Sign Detection Flow:

1. **User performs sign language gesture** in front of webcam
2. **Frame captured every 1.5 seconds** (not video recording)
3. **Sent to backend** → All 5 Roboflow models analyze the image
4. **Best prediction selected** (highest confidence)
5. **Anthropic AI interprets** the recognized word into a natural sentence
6. **Results displayed** in two sections:
   - **Detected Words**: Raw recognized signs (e.g., "help", "passport")
   - **AI Interpretation**: Natural sentence (e.g., "I need help.", "I need passport services.")

### Example:

```
User signs: "help"
↓
Roboflow detects: "help" (95% confidence)
↓
OpenAI GPT-4o-mini interprets: "I need help."
↓
Display:
  Detected Words: [help]
  AI Interpretation: "I need help."
```

### Multiple Signs:

```
User signs: "passport" → "please"
↓
Detected Words: [passport] [please]
↓
AI Interpretation: "I need passport services, please."
```

## 🔧 Configuration

### Without OpenAI API Key (Fallback Mode):

If no API key is configured, the system will use a simple mapping:

```python
LABEL_TO_SENTENCE = {
    "help": "I need help.",
    "passport": "I need passport services.",
    "license": "I want to renew my license.",
    # ... more mappings
}
```

### With OpenAI API Key (AI Mode):

GPT-4o-mini will interpret the signs contextually and generate natural sentences.

## 📊 Features

✅ **Real-time detection** - No video recording, just frame-by-frame analysis
✅ **Multi-model comparison** - 5 different Roboflow models for accuracy
✅ **AI interpretation** - Natural language generation using GPT-4o-mini
✅ **Visual feedback** - See detected words and interpretations separately
✅ **Confidence scores** - Know how confident the model is
✅ **Backend status** - Check if API is online/offline

## 🐛 Troubleshooting

### Backend shows "Offline":
```bash
# Check if backend is running
curl http://localhost:8000/health

# Restart backend
cd backend
python start_backend.py
```

### "OpenAI API key not configured" warning:
- Add your API key to `backend/.env`
- Restart the backend server
- System will fall back to simple mapping if no key

### No signs detected:
- Ensure good lighting
- Position hand clearly in frame
- Try different signs from the trained set
- Check console for detection logs

## 📝 Environment Variables

Create `backend/.env`:

```env
# Required for AI interpretation
OPENAI_API_KEY=sk-proj-...

# Already configured (optional to override)
ROBOFLOW_API_KEY=PfNLBY9FSfXGfx9lccYk
```

## 🎨 UI Layout

```
┌─────────────────────────────────────────┐
│  Camera Box (Large - 2x width)          │
│  [Webcam feed with "Recording" badge]   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Recognized Signs                        │
│  ┌───────────────────────────────────┐  │
│  │ Detected Words:                   │  │
│  │ [help] [passport] [please]        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ 🤖 AI Interpretation:             │  │
│  │ "I need help with passport        │  │
│  │  services, please."               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 🚦 Status Indicators

- **Backend API**: Online/Offline/Checking
- **Deaf Mode**: Active/Inactive
- **Camera**: Ready/Standby
- **AI Detection**: Processing.../Idle
- **Detecting...**: Animated badge when analyzing frame

## 📖 Console Logs

Watch browser console (F12) for detailed logs:
- `✅ Backend is online`
- `🔍 Detecting gesture...`
- `📤 Sending frame to backend...`
- `📥 Backend response:`
- `✅ Sign detected: help (95%)`
- `🤖 AI Interpretation: I need help.`

Happy signing! 🤟

