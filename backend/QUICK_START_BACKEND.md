# Backend Quick Start Guide

## 📁 Backend Structure

```
backend/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── test_roboflow.py       # Test single model
├── test_multi_models.py   # Test all models
├── start_backend.py       # Python startup script
├── start_backend.bat      # Windows startup script
├── start_backend.sh       # Linux/Mac startup script
├── setup_venv.bat         # Windows virtual env setup
├── setup_venv.sh          # Linux/Mac virtual env setup
├── .gitignore            # Git ignore rules
├── README.md             # Full documentation
└── test.jpeg             # Test image

Generated:
├── venv/                 # Virtual environment (after setup)
└── __pycache__/          # Python cache (ignored by git)
```

## 🚀 Quick Start

### 1. Navigate to Backend
```bash
cd backend
```

### 2. Install Dependencies

**Option 1: Automatic Setup (Recommended)**

Windows:
```bash
setup_venv.bat
```

Linux/Mac:
```bash
chmod +x setup_venv.sh
./setup_venv.sh
```

**Option 2: Manual Setup**
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Start the Server

**Option 1: Using Python Script**
```bash
python start_backend.py
```

**Option 2: Using Batch/Shell Script**

Windows:
```bash
start_backend.bat
```

Linux/Mac:
```bash
chmod +x start_backend.sh
./start_backend.sh
```

**Option 3: Direct uvicorn**
```bash
uvicorn main:app --reload --port 8000
```

## 🌐 Access the API

- **API Base**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Models Info**: http://localhost:8000/models

## 🧪 Testing

### Test Single Model
```bash
python test_roboflow.py
```

### Test All Models
```bash
python test_multi_models.py
```

## 📊 Available Models

1. **Primary**: `bim-recognition-x7qsz/10` - BIM Recognition Model
2. **Secondary**: `mysl-dfq0t/1` - MYSL Model
3. **Tertiary**: `sign-language-3jtnh/1` - Sign Language (Mothana)
4. **Quaternary**: `sign-language-kqyow/1` - Sign Language (Mehedi)
5. **Quinary**: `sign-language-detection-nygkw/2` - Sign Language Detection (Chandana)

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Use different port
uvicorn main:app --reload --port 8001
```

### Import Errors
```bash
# Make sure virtual environment is activated
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### Missing Dependencies
```bash
pip install -r requirements.txt
```

## 📝 Notes

- The `.gitignore` file excludes `venv/`, `__pycache__/`, and test images
- All startup scripts automatically navigate to the correct directory
- The server auto-reloads when code changes are detected
- Test images (`.jpg`, `.png`, `.jpeg`) are ignored by git except `example.jpg`

