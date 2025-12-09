# BIM Sign Language Recognition - Backend

This backend uses Roboflow's pre-trained model to recognize Malaysian Sign Language (BIM) gestures.

## Model Information

This backend uses multiple Roboflow models for improved accuracy:

### Primary Model - BIM Recognition
- **Model URL**: https://universe.roboflow.com/fyp-xvmx6/bim-recognition-x7qsz
- **Model ID**: `bim-recognition-x7qsz/10`

### Secondary Model - MYSL
- **Model URL**: https://universe.roboflow.com/danig/mysl-dfq0t
- **Model ID**: `mysl-dfq0t/1`

### Tertiary Model - Sign Language (Mothana)
- **Model URL**: https://universe.roboflow.com/mothana/sign-language-3jtnh
- **Model ID**: `sign-language-3jtnh/1`

### Quaternary Model - Sign Language (Mehedi)
- **Model URL**: https://universe.roboflow.com/computer-vision-by-mehedi/sign-language-kqyow
- **Model ID**: `sign-language-kqyow/1`

### Quinary Model - Sign Language Detection (Chandana)
- **Model URL**: https://universe.roboflow.com/chandanas-workspace/sign-language-detection-nygkw
- **Model ID**: `sign-language-detection-nygkw/2`

### API Configuration
- **API Key**: `PfNLBY9FSfXGfx9lccYk`

## Setup

### Option 1: Automatic Setup (Recommended)

#### Windows:
```bash
setup_venv.bat
```

#### Linux/Mac:
```bash
chmod +x setup_venv.sh
./setup_venv.sh
```

### Option 2: Manual Setup

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

2. **Activate virtual environment:**
   
   **Windows:**
   ```bash
   venv\Scripts\activate
   ```
   
   **Linux/Mac:**
   ```bash
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### 1. Test Roboflow Models

#### Test Single Model
Test the primary model with a single image:

```bash
python test_roboflow.py
```

This will:
- Load `test.jpg` from the backend folder
- Send it to the Roboflow API (primary model)
- Print the detection results with confidence scores

#### Test Multiple Models
Compare results from all available models:

```bash
python test_multi_models.py
```

This will:
- Test `test.jpg` with all available models
- Compare predictions and confidence scores
- Show which model performs best

**Expected Output:**
```
Testing Roboflow BIM Sign Language Recognition...
--------------------------------------------------

✅ Inference successful!

Full Result:
{
  "predictions": [
    {
      "class": "help",
      "confidence": 0.95,
      "x": 320.5,
      "y": 240.3,
      "width": 150.2,
      "height": 180.7
    }
  ],
  ...
}

==================================================
PREDICTIONS:
==================================================

Prediction 1:
  Class: help
  Confidence: 95.00%
  Position: (320.5, 240.3)
  Size: 150.2x180.7
```

### 2. Run FastAPI Server

Start the API server:

**Option 1: Using the start script (Recommended)**
```bash
cd backend
python start_backend.py
```

**Option 2: Using uvicorn directly**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Option 3: Using Python**
```bash
cd backend
python main.py
```

The server will start at: **http://localhost:8000**

### 3. API Endpoints

#### Root Endpoint
```bash
GET http://localhost:8000/
```

#### Health Check
```bash
GET http://localhost:8000/health
```

#### Sign Language Recognition (Single Model)
```bash
POST http://localhost:8000/sign-to-text?model=primary
Content-Type: multipart/form-data

Body: 
  - file (image file)
  - model (optional: "primary" or "secondary", defaults to "primary")
```

**Example using curl:**
```bash
# Using primary model (default)
curl -X POST "http://localhost:8000/sign-to-text" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.jpg"

# Using secondary model
curl -X POST "http://localhost:8000/sign-to-text?model=secondary" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.jpg"

# Using tertiary model
curl -X POST "http://localhost:8000/sign-to-text?model=tertiary" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.jpg"

# Using quaternary model
curl -X POST "http://localhost:8000/sign-to-text?model=quaternary" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.jpg"

# Using quinary model
curl -X POST "http://localhost:8000/sign-to-text?model=quinary" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.jpg"
```

#### Sign Language Recognition (Multi-Model)
Test with all models simultaneously:

```bash
POST http://localhost:8000/sign-to-text-multi
Content-Type: multipart/form-data

Body: file (image file)
```

**Example using curl:**
```bash
curl -X POST "http://localhost:8000/sign-to-text-multi" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test.jpg"
```

**Example Response (Single Model):**
```json
{
  "success": true,
  "label": "help",
  "text": "I need help.",
  "confidence": 0.95,
  "model_used": "bim-recognition-x7qsz/10",
  "all_predictions": [
    {
      "class": "help",
      "confidence": 0.95,
      "x": 320.5,
      "y": 240.3,
      "width": 150.2,
      "height": 180.7
    }
  ]
}
```

**Example Response (Multi-Model):**
```json
{
  "results": {
    "primary": {
      "success": true,
      "label": "help",
      "text": "I need help.",
      "confidence": 0.95,
      "model_id": "bim-recognition-x7qsz/10",
      "prediction_count": 1
    },
    "secondary": {
      "success": true,
      "label": "help",
      "text": "I need help.",
      "confidence": 0.87,
      "model_id": "mysl-dfq0t/1",
      "prediction_count": 1
    },
    "tertiary": {
      "success": true,
      "label": "help",
      "text": "I need help.",
      "confidence": 0.91,
      "model_id": "sign-language-3jtnh/1",
      "prediction_count": 1
    },
    "quaternary": {
      "success": true,
      "label": "help",
      "text": "I need help.",
      "confidence": 0.89,
      "model_id": "sign-language-kqyow/1",
      "prediction_count": 1
    },
    "quinary": {
      "success": true,
      "label": "help",
      "text": "I need help.",
      "confidence": 0.93,
      "model_id": "sign-language-detection-nygkw/2",
      "prediction_count": 1
    }
  },
  "best_model": "primary",
  "best_result": {
    "success": true,
    "label": "help",
    "text": "I need help.",
    "confidence": 0.95,
    "model_id": "bim-recognition-x7qsz/10",
    "prediction_count": 1
  }
}
```

#### Get Available Labels
```bash
GET http://localhost:8000/labels
```

**Response:**
```json
{
  "labels": {
    "help": "I need help.",
    "passport": "I need passport services.",
    "license": "I want to renew my license.",
    "thank_you": "Thank you.",
    "hello": "Hello.",
    "goodbye": "Goodbye.",
    "yes": "Yes.",
    "no": "No.",
    "please": "Please.",
    "sorry": "I'm sorry."
  },
  "count": 10
}
```

#### Get Available Models
```bash
GET http://localhost:8000/models
```

**Response:**
```json
{
  "models": {
    "primary": "bim-recognition-x7qsz/10",
    "secondary": "mysl-dfq0t/1",
    "tertiary": "sign-language-3jtnh/1",
    "quaternary": "sign-language-kqyow/1",
    "quinary": "sign-language-detection-nygkw/2"
  },
  "default": "primary",
  "descriptions": {
    "primary": "BIM Recognition Model v10 - Main Malaysian Sign Language model",
    "secondary": "MYSL Model - Alternative Malaysian Sign Language model",
    "tertiary": "Sign Language Model (Mothana) - General sign language recognition",
    "quaternary": "Sign Language Model (Mehedi) - Computer vision based sign language",
    "quinary": "Sign Language Detection (Chandana) - Advanced sign language detection"
  }
}
```

## Label Mappings

The following sign language gestures are mapped to sentences:

| Label | Sentence |
|-------|----------|
| help | I need help. |
| passport | I need passport services. |
| license | I want to renew my license. |
| thank_you | Thank you. |
| hello | Hello. |
| goodbye | Goodbye. |
| yes | Yes. |
| no | No. |
| please | Please. |
| sorry | I'm sorry. |

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Testing with Frontend

The FastAPI server is configured with CORS to allow requests from the Next.js frontend.

### Single Model Request
```typescript
const formData = new FormData();
formData.append('file', imageFile);

// Using default (primary) model
const response = await fetch('http://localhost:8000/sign-to-text', {
  method: 'POST',
  body: formData,
});

// Or specify model
const response = await fetch('http://localhost:8000/sign-to-text?model=secondary', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result.text); // "I need help."
console.log(result.model_used); // "bim-recognition-x7qsz/10"
```

### Multi-Model Request
```typescript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('http://localhost:8000/sign-to-text-multi', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result.best_model); // "primary"
console.log(result.best_result.text); // "I need help."
console.log(result.results.primary.confidence); // 0.95
console.log(result.results.secondary.confidence); // 0.87
console.log(result.results.tertiary.confidence); // 0.91
console.log(result.results.quaternary.confidence); // 0.89
console.log(result.results.quinary.confidence); // 0.93
```

## Project Structure

```
backend/
├── main.py              # FastAPI server
├── test_roboflow.py     # Test script for Roboflow model
├── requirements.txt     # Python dependencies
├── setup_venv.bat       # Windows setup script
├── setup_venv.sh        # Linux/Mac setup script
├── test.jpg             # Test image
├── README.md            # This file
└── venv/                # Virtual environment (created after setup)
```

## Troubleshooting

### Issue: `test.jpg` not found
**Solution**: Make sure `test.jpg` is in the `backend/` folder.

### Issue: Import errors
**Solution**: Make sure the virtual environment is activated:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### Issue: Port 8000 already in use
**Solution**: Use a different port:
```bash
uvicorn main:app --reload --port 8001
```

### Issue: CORS errors from frontend
**Solution**: The server is already configured for CORS. Make sure the frontend is making requests to the correct URL.

## Development

To add more label mappings, edit the `LABEL_TO_SENTENCE` dictionary in `main.py`:

```python
LABEL_TO_SENTENCE = {
    "help": "I need help.",
    "passport": "I need passport services.",
    # Add more mappings here
    "new_gesture": "New sentence here.",
}
```

## License

This project is part of the NexG Godamlah Hackathon 2025.

