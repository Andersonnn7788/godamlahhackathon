"""
FastAPI server for BIM Sign Language Recognition using Hybrid Detection (MediaPipe + Roboflow) + OpenAI GPT-4o-mini
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from inference_sdk import InferenceHTTPClient
from PIL import Image
import tempfile
import os
import io
from typing import Dict, Any, List
import logging
from openai import OpenAI
from dotenv import load_dotenv
from hybrid_detector import HybridSignDetector
from multi_model_detector import MultiModelDetector
from accurate_sign_detector import AccurateSignDetector

# AI Features imports
from models.visit_history import (
    VisitHistory,
    VisitStatus,
    DepartmentalLog,
    PredictIntentRequest,
    GenerateCaseBriefRequest,
    GenerateGreetingRequest,
)
from prediction_engine import IntentPredictionEngine
from case_brief_generator import CaseBriefGenerator
from greeting_generator import GreetingGenerator

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="BIM Sign Language Recognition API",
    description="API for recognizing Malaysian Sign Language (BIM) using MediaPipe + Roboflow",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize API keys
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "PfNLBY9FSfXGfx9lccYk")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize Accurate Sign Detector (MediaPipe hand detection + Roboflow classification)
accurate_detector = AccurateSignDetector(roboflow_api_key=ROBOFLOW_API_KEY)

# Initialize Hybrid Detector (MediaPipe + Roboflow) - Legacy
hybrid_detector = HybridSignDetector(roboflow_api_key=ROBOFLOW_API_KEY)

# Initialize Multi-Model Detector (for comparison and visualization) - Legacy
multi_model_detector = MultiModelDetector(roboflow_api_key=ROBOFLOW_API_KEY)

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Initialize AI Feature Engines
prediction_engine = IntentPredictionEngine(openai_client=openai_client)
case_brief_generator = CaseBriefGenerator(openai_client=openai_client)
greeting_generator = GreetingGenerator(openai_client=openai_client)

# Legacy Roboflow client (for fallback)
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key=ROBOFLOW_API_KEY
)

# Single best model (used by hybrid detector)
BEST_MODEL = "bim-recognition-x7qsz/10"

# Demo mode: Global counter for alternating between "tolong" and "saya"
_demo_detection_counter = 0

# Mapping from detected labels to sentences (Malaysian Sign Language focused)
LABEL_TO_SENTENCE = {
    # Malaysian Sign Language (BIM) - Primary
    "saya": "I / Me",
    "tolong": "Help / Please help me",
    "terima kasih": "Thank you",
    "maaf": "Sorry / Excuse me",
    "ya": "Yes",
    "tidak": "No",
    "nama": "Name",
    "apa": "What",
    "siapa": "Who", 
    "bila": "When",
    "di mana": "Where",
    "mengapa": "Why",
    "bagaimana": "How",
    "selamat pagi": "Good morning",
    "selamat petang": "Good afternoon", 
    "selamat malam": "Good evening",
    "apa khabar": "How are you?",
    "sihat": "Healthy / Fine",
    "sakit": "Sick / Pain",
    "lapar": "Hungry",
    "haus": "Thirsty",
    "makan": "Eat",
    "minum": "Drink",
    "rumah": "House / Home",
    "sekolah": "School",
    "kerja": "Work",
    
    # English fallback (legacy)
    "help": "I need help.",
    "passport": "I need passport services.",
    "license": "I want to renew my license.",
    "thank_you": "Thank you.",
    "hello": "Hello.",
    "goodbye": "Goodbye.",
    "yes": "Yes.",
    "no": "No.",
    "please": "Please.",
    "sorry": "I'm sorry.",
    
    # Filtered out
    "important": "[FILTERED: Not a Malaysian sign]",
}

async def interpret_with_ai(recognized_words: List[str]) -> str:
    """
    Use OpenAI GPT-4o-mini to interpret recognized sign language words into a natural sentence.
    
    Args:
        recognized_words: List of recognized sign language words
        
    Returns:
        Natural language interpretation
    """
    if not openai_client:
        logger.warning("OpenAI API key not configured, using fallback")
        # Fallback to simple mapping
        if len(recognized_words) == 1:
            return LABEL_TO_SENTENCE.get(recognized_words[0].lower(), f"Sign: {recognized_words[0]}")
        return " ".join(recognized_words)
    
    try:
        words_str = ", ".join(recognized_words)
        logger.info(f"Interpreting words with AI: {words_str}")
        
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=100,
            messages=[{
                "role": "user",
                "content": f"""You are interpreting Malaysian Sign Language (BIM) gestures. 
The following sign language words were recognized: {words_str}

Convert these into a natural, short sentence that represents what the deaf person is trying to communicate. 
Keep it concise (under 15 words) and natural.

Examples:
- "help" → "I need help."
- "passport, please" → "I need passport services, please."
- "thank you" → "Thank you."

Only respond with the interpreted sentence, nothing else."""
            }]
        )
        
        interpretation = response.choices[0].message.content.strip()
        logger.info(f"AI interpretation: {interpretation}")
        return interpretation
        
    except Exception as e:
        logger.error(f"AI interpretation failed: {str(e)}")
        # Fallback to simple mapping
        if len(recognized_words) == 1:
            return LABEL_TO_SENTENCE.get(recognized_words[0].lower(), f"Sign: {recognized_words[0]}")
        return " ".join(recognized_words)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "BIM Sign Language Recognition API",
        "status": "running",
        "endpoints": {
            "sign_to_text": "/sign-to-text (POST)",
            "health": "/health (GET)"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "accurate_detector": "enabled (MediaPipe + Roboflow)",
        "hybrid_detector": "enabled (legacy)",
        "multi_model_detector": "enabled (legacy)",
        "best_model": BEST_MODEL,
        "ai_model": "gpt-4o-mini",
        "features": {
            "hand_detection": "MediaPipe",
            "sign_classification": "Roboflow Multi-Model",
            "false_positive_filtering": "enabled",
            "bounding_boxes": "always on hands"
        }
    }

@app.post("/detect-demo")
async def detect_demo(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Demo mode detection - uses real hand detection but mocks sign labels
    Pattern: "tolong" (0.5s) → "saya" (0.5s) → delay (1s) → repeat
    Prevents confusion between series by adding pause between cycles

    Args:
        file: Uploaded image file

    Returns:
        JSON with real hand positions but mocked sign labels
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Please upload an image."
            )

        # Read image contents
        contents = await file.read()

        # Validate image
        try:
            img = Image.open(io.BytesIO(contents))
            img.verify()
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image file: {str(e)}"
            )

        # Use hand detector to get real hand positions
        import cv2
        import numpy as np
        from hand_detector import HandDetector

        # Convert image to numpy array
        img = Image.open(io.BytesIO(contents))
        img_array = np.array(img)

        # Convert RGB to BGR for OpenCV
        if len(img_array.shape) == 2:  # Grayscale
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_GRAY2BGR)
        elif img_array.shape[2] == 4:  # RGBA
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
        else:  # RGB
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        # Detect hands
        hand_detector = HandDetector()
        hand_detections = hand_detector.detect_hands(img_bgr)

        if not hand_detections:
            return {
                "success": False,
                "message": "No hands detected - please show your hand to the camera",
                "bounding_boxes": [],
                "num_hands": 0,
                "method": "demo"
            }

        # Mock detection - Series pattern with delays
        # Pattern: tolong (1s) → saya (1s) → delay (2s) → repeat
        global _demo_detection_counter
        import time

        # Increment counter every second
        current_second = int(time.time())
        if not hasattr(detect_demo, '_last_second'):
            detect_demo._last_second = current_second
            _demo_detection_counter = 0
        elif current_second != detect_demo._last_second:
            detect_demo._last_second = current_second
            _demo_detection_counter += 1

        # Series pattern: 0=tolong, 1=saya, 2=delay, 3=delay, then repeat
        position_in_series = _demo_detection_counter % 4

        if position_in_series == 0:
            current_label = "tolong"
            series_state = "active"
        elif position_in_series == 1:
            current_label = "saya"
            series_state = "active"
        else:
            # Delay period (positions 2 and 3)
            current_label = None
            series_state = "delay"

        # During delay, don't return any new detections
        if series_state == "delay":
            logger.info(f"🎭 Demo: Delay period (counter={_demo_detection_counter})")
            return {
                "success": False,
                "message": "Series delay - processing previous detections",
                "bounding_boxes": [],
                "num_hands": len(hand_detections),
                "series_state": "delay",
                "position_in_series": position_in_series,
                "method": "demo"
            }

        # Convert hand detections to bounding boxes with mocked labels
        bounding_boxes = []
        for detection in hand_detections:
            bbox = detection['bbox']
            landmarks = detection.get('landmarks', {})

            bounding_boxes.append({
                'x': bbox['x'],
                'y': bbox['y'],
                'width': bbox['width'],
                'height': bbox['height'],
                'class': current_label,
                'confidence': 0.95,  # Mock high confidence
                'color': '#FF0000' if current_label == 'tolong' else '#00FF00',
                'hand': detection['hand_label'],
                'landmarks': landmarks
            })

        logger.info(f"🎭 Demo detection: {current_label} with {len(hand_detections)} hand(s) (position {position_in_series}/3)")

        return {
            "success": True,
            "label": current_label,
            "text": LABEL_TO_SENTENCE.get(current_label, current_label),
            "confidence": 0.95,
            "model_used": "demo",
            "hand": hand_detections[0]['hand_label'],
            "bounding_boxes": bounding_boxes,
            "num_hands": len(hand_detections),
            "processing_time": 0.05,
            "series_state": series_state,
            "position_in_series": position_in_series,
            "method": "demo"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Demo detection failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.post("/detect-accurate")
async def detect_accurate(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Accurate sign detection using MediaPipe hand detection + Roboflow classification
    Ensures bounding boxes are always on actual hands, filters false positives

    Args:
        file: Uploaded image file

    Returns:
        JSON with detected signs, bounding boxes, and confidence
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Please upload an image."
            )
        
        # Read image contents
        contents = await file.read()
        
        # Validate image
        try:
            img = Image.open(io.BytesIO(contents))
            img.verify()
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image file: {str(e)}"
            )
        
        # Detect signs using accurate detector
        logger.info("🔍 Running accurate sign detection (MediaPipe + Roboflow)...")
        result = accurate_detector.detect_signs(contents)
        
        if result['success']:
            logger.info(f"✅ Detected: {result['label']} ({result['confidence']:.2%}) on {result['hand']} hand")
            
            return {
                "success": True,
                "label": result['label'],
                "text": LABEL_TO_SENTENCE.get(result['label'].lower(), result['label']),
                "confidence": result['confidence'],
                "model_used": result['model_used'],
                "hand": result['hand'],
                "bounding_boxes": result['bounding_boxes'],
                "num_hands": result['num_hands'],
                "processing_time": result['processing_time'],
                "method": "MediaPipe + Roboflow"
            }
        else:
            logger.warning(f"⚠️ {result.get('message', 'No confident detection')}")
            return {
                "success": False,
                "message": result.get('message', 'No confident detection'),
                "bounding_boxes": result.get('bounding_boxes', []),
                "num_hands": result.get('num_hands', 0),
                "processing_time": result['processing_time'],
                "method": "MediaPipe + Roboflow"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Accurate detection failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.get("/models")
async def get_models():
    """Get information about all available models"""
    return multi_model_detector.get_model_info()

@app.post("/sign-to-text")
async def sign_to_text(
    file: UploadFile = File(...),
    model: str = "primary"  # Legacy endpoint - use /sign-to-text-fast for better performance
) -> Dict[str, Any]:
    """
    Convert sign language image to text
    
    Args:
        file: Uploaded image file
        model: Model to use ("primary" or "secondary")
        
    Returns:
        JSON with label, text, and confidence
    """
    temp_file_path = None
    
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Please upload an image."
            )
        
        # Read image contents
        contents = await file.read()
        
        # Validate image by trying to open it
        try:
            img = Image.open(io.BytesIO(contents))
            img.verify()  # Verify it's a valid image
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image file: {str(e)}"
            )
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            temp_file.write(contents)
            temp_file_path = temp_file.name
        
        # Use best model (legacy endpoint)
        model_id = BEST_MODEL
        logger.info(f"Processing image: {file.filename} (size: {len(contents)} bytes) with model: {model_id} (legacy endpoint)")
        
        # Run inference
        result = CLIENT.infer(temp_file_path, model_id=model_id)
        
        # Process predictions
        if "predictions" in result and result["predictions"]:
            # Get the prediction with highest confidence
            predictions = result["predictions"]
            best_prediction = max(predictions, key=lambda x: x.get("confidence", 0))
            
            label = best_prediction.get("class", "unknown")
            confidence = best_prediction.get("confidence", 0.0)
            
            # Map label to sentence
            text = LABEL_TO_SENTENCE.get(label.lower(), f"Sign detected: {label}")
            
            logger.info(f"Detected: {label} (confidence: {confidence:.2%})")
            
            return {
                "success": True,
                "label": label,
                "text": text,
                "confidence": confidence,
                "model_used": model_id,
                "all_predictions": [
                    {
                        "class": pred.get("class"),
                        "confidence": pred.get("confidence"),
                        "x": pred.get("x"),
                        "y": pred.get("y"),
                        "width": pred.get("width"),
                        "height": pred.get("height")
                    }
                    for pred in predictions
                ]
            }
        else:
            logger.warning("No predictions found in the image")
            return {
                "success": False,
                "label": None,
                "text": "No sign language detected in the image.",
                "confidence": 0.0,
                "model_used": model_id,
                "all_predictions": []
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file: {e}")

@app.get("/labels")
async def get_labels():
    """Get all available label mappings"""
    return {
        "labels": LABEL_TO_SENTENCE,
        "count": len(LABEL_TO_SENTENCE)
    }

@app.get("/models")
async def get_models():
    """Get available models"""
    return {
        "hybrid_detector": {
            "model": BEST_MODEL,
            "description": "Hybrid detector using MediaPipe + Roboflow for optimal performance",
            "features": ["hand_detection", "region_cropping", "caching", "single_model"]
        },
        "performance_stats": hybrid_detector.get_performance_stats()
    }

@app.post("/sign-to-text-fast")
async def sign_to_text_fast(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    FAST sign language detection using Hybrid Detector (MediaPipe + Single Roboflow Model)
    
    This endpoint is optimized for speed and accuracy:
    - MediaPipe hand detection (local, fast)
    - Single best Roboflow model
    - Image preprocessing and caching
    - 3-5x faster than multi-model approach
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Please upload an image."
            )
        
        # Read image contents
        contents = await file.read()
        logger.info(f"📸 Processing image: {file.filename} ({len(contents)} bytes)")
        
        # Use hybrid detector for fast detection
        detection_result = hybrid_detector.detect_sign_fast(contents)
        
        if detection_result.get("success"):
            label = detection_result.get("label", "unknown")
            confidence = detection_result.get("confidence", 0.0)
            
            # Use AI to interpret the recognized label
            ai_interpretation = await interpret_with_ai([label])
            
            logger.info(f"✅ Fast detection: {label} ({confidence:.2%}) -> '{ai_interpretation}'")
            
            return {
                "success": True,
                "label": label,
                "text": ai_interpretation,
                "confidence": confidence,
                "model_used": detection_result.get("model_used", BEST_MODEL),
                "processing_time": detection_result.get("processing_time", 0),
                "from_cache": detection_result.get("from_cache", False),
                "method": "hybrid_detector"
            }
        else:
            return {
                "success": False,
                "label": None,
                "text": "No sign language detected in the image.",
                "confidence": 0.0,
                "error": detection_result.get("error", "Detection failed"),
                "processing_time": detection_result.get("processing_time", 0),
                "method": "hybrid_detector"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Fast detection error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )

@app.post("/sign-to-text-multi")
async def sign_to_text_multi(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Convert sign language image to text using multiple models with bounding box visualization
    
    Args:
        file: Uploaded image file
        
    Returns:
        JSON with results from all models including bounding boxes and annotated image
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Please upload an image."
            )
        
        # Read image contents
        contents = await file.read()
        
        # Validate image by trying to open it
        try:
            img = Image.open(io.BytesIO(contents))
            img.verify()  # Verify it's a valid image
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image file: {str(e)}"
            )
        
        logger.info(f"📸 Processing image with multi-model detector: {file.filename} ({len(contents)} bytes)")
        
        # Use multi-model detector to get all predictions with bounding boxes
        detection_result = multi_model_detector.detect_all_models(contents)
        
        if not detection_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=detection_result.get("error", "Multi-model detection failed")
            )
        
        # Get best overall prediction
        best_overall = detection_result.get("best_overall")
        
        # Use AI to interpret the recognized label if available
        ai_interpretation = None
        if best_overall and best_overall.get("prediction"):
            label = best_overall["prediction"].get("class", "unknown")
            # Interpret with AI
            ai_interpretation = await interpret_with_ai([label])
            logger.info(f"✅ Best model: {best_overall['model']} - {label} ({best_overall['confidence']:.2%}) -> '{ai_interpretation}'")
        
        return {
            "success": True,
            "best_overall": {
                "label": best_overall["prediction"].get("class", "unknown") if best_overall else None,
                "confidence": best_overall.get("confidence", 0) if best_overall else 0,
                "model": best_overall.get("model") if best_overall else None,
                "ai_interpretation": ai_interpretation
            },
            "models": detection_result.get("models", {}),
            "annotated_image": detection_result.get("annotated_image"),
            "total_models": detection_result.get("total_models", 0),
            "models_with_detections": detection_result.get("models_with_detections", 0),
            "method": "multi_model_with_bbox"
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Multi-model detection error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )

@app.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Convert speech audio to text using OpenAI Whisper API
    
    Args:
        audio: Audio file (webm, mp3, wav, etc.)
        
    Returns:
        Transcribed text
    """
    if not openai_client:
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key not configured"
        )
    
    try:
        logger.info(f"📢 Transcribing audio: {audio.filename}")
        
        # Read audio file
        audio_data = await audio.read()
        
        # Create temporary file for OpenAI API
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            temp_audio.write(audio_data)
            temp_audio_path = temp_audio.name
        
        try:
            # Transcribe using OpenAI Whisper
            with open(temp_audio_path, "rb") as audio_file:
                transcript = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="ms"  # Malay language
                )
            
            transcribed_text = transcript.text
            logger.info(f"✅ Transcription: {transcribed_text}")
            
            return {
                "success": True,
                "text": transcribed_text,
                "language": "ms"
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)
                
    except Exception as e:
        logger.error(f"❌ Speech-to-text error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error transcribing audio: {str(e)}"
        )

# Mock user profiles database (hardcoded for demo)
MOCK_USER_PROFILES = {
    "900125-14-0123": {
        "name": "Ahmad bin Abdullah",
        "ic_number": "900125-14-0123",
        "age": 35,
        "disability_level": "Full Deaf",
        "home_address": "123 Jalan Bukit Bintang, 50200 Kuala Lumpur",
        "race": "Malay",
        "emergency_contact": {
            "name": "Siti binti Abdullah",
            "relationship": "Wife",
            "phone": "+60123456789"
        },
        "preferences": {
            "communication_method": "BIM (Malaysian Sign Language)",
            "requires_interpreter": True,
            "speech_ability": "Cannot speak verbally",
            "hearing_aid": False,
            "lip_reading": False,
            "written_communication": "Prefers BIM, can read Malay and English",
            "patience_level": "Requires extra time for communication",
            "visual_attention": "Please maintain eye contact and clear facial expressions",
            "notes": "Please use sign language or written communication. Avoid speaking as user cannot hear."
        }
    },
    "970512-05-1234": {
        "name": "Lim Wei Ming",
        "ic_number": "970512-05-1234",
        "age": 28,
        "disability_level": "Partially Deaf (Moderate Hearing Loss)",
        "home_address": "456 Jalan Ampang, 50450 Kuala Lumpur",
        "race": "Chinese",
        "emergency_contact": {
            "name": "Lim Wei Keong",
            "relationship": "Brother",
            "phone": "+60198765432"
        },
        "preferences": {
            "communication_method": "BIM or Clear Speech",
            "requires_interpreter": False,
            "speech_ability": "Can speak clearly",
            "hearing_aid": True,
            "lip_reading": True,
            "written_communication": "Can read and write in Malay, English, and Chinese",
            "patience_level": "Normal pace, speak clearly and face user",
            "visual_attention": "Please face user when speaking, speak clearly and slightly louder",
            "notes": "User wears hearing aid. Please speak clearly, face the user, and avoid background noise."
        }
    },
    "830901-01-0123": {
        "name": "Priya Devi",
        "ic_number": "830901-01-0123",
        "age": 42,
        "disability_level": "Full Deaf (Since Birth)",
        "home_address": "789 Jalan Tun Razak, 50400 Kuala Lumpur",
        "race": "Indian",
        "emergency_contact": {
            "name": "Rajesh Kumar",
            "relationship": "Husband",
            "phone": "+60123456789"
        },
        "preferences": {
            "communication_method": "BIM (Malaysian Sign Language) or Written",
            "requires_interpreter": True,
            "speech_ability": "Limited speech, prefers sign language",
            "hearing_aid": False,
            "lip_reading": "Basic lip reading skills",
            "written_communication": "Prefers BIM, fluent in written English and Tamil",
            "patience_level": "Requires extra time and patience",
            "visual_attention": "Please maintain eye contact, use clear gestures and facial expressions",
            "notes": "Deaf since birth. Best communication: BIM sign language. Can read English and Tamil. Please be patient and use visual communication methods."
        }
    },
    "001231-01-0123": {
        "name": "Sarah binti Mohd",
        "ic_number": "001231-01-0123",
        "age": 25,
        "disability_level": "Partially Deaf (Severe Hearing Loss)",
        "home_address": "321 Jalan Pudu, 55100 Kuala Lumpur",
        "race": "Malay",
        "emergency_contact": {
            "name": "Mohd bin Ali",
            "relationship": "Father",
            "phone": "+60123456789"
        },
        "preferences": {
            "communication_method": "BIM or Clear Speech with Visual Aids",
            "requires_interpreter": "Optional (prefers when available)",
            "speech_ability": "Can speak, may have slight speech differences",
            "hearing_aid": True,
            "lip_reading": True,
            "written_communication": "Fluent in written Malay and English",
            "patience_level": "Normal pace, but speak clearly",
            "visual_attention": "Please face user directly, speak clearly and at moderate pace. User can lip read well.",
            "notes": "User has severe hearing loss but wears hearing aid. Can communicate verbally if you speak clearly and face them. BIM sign language preferred for complex information."
        }
    }
}

# Mock Visit History Database (for AI Features demo)
MOCK_VISIT_HISTORY: Dict[str, List[Dict]] = {
    "900125-14-0123": [  # Ahmad bin Abdullah
        {
            "id": "VH-001",
            "user_id": "900125-14-0123",
            "location": "Immigration",
            "department": "Jabatan Imigresen Malaysia",
            "datetime": "2025-01-05T09:30:00",
            "application": "Passport Renewal",
            "queue": "A032",
            "status": "In Progress",
            "documents_requested": ["Old Passport", "IC"],
            "documents_submitted": ["Old Passport"],
            "handling_time_minutes": 45,
            "officer_notes": "Citizen needs to submit IC copy",
            "phrases_detected": ["tolong", "saya", "passport"],
            "follow_up_required": True,
            "follow_up_date": "2025-01-12",
            "preferred_language": "BIM"
        },
        {
            "id": "VH-002",
            "user_id": "900125-14-0123",
            "location": "JKM",
            "department": "Jabatan Kebajikan Masyarakat",
            "datetime": "2025-01-02T14:00:00",
            "application": "Bantuan OKU Renewal",
            "queue": "W015",
            "status": "Completed",
            "documents_requested": ["Bank Statement", "OKU Card"],
            "documents_submitted": ["OKU Card"],
            "handling_time_minutes": 30,
            "officer_notes": "Bank statement still pending",
            "phrases_detected": ["tolong", "bantuan"],
            "follow_up_required": True,
            "follow_up_date": "2025-01-10",
            "preferred_language": "BIM"
        },
        {
            "id": "VH-003",
            "user_id": "900125-14-0123",
            "location": "JPJ",
            "department": "Jabatan Pengangkutan Jalan",
            "datetime": "2024-12-28T10:15:00",
            "application": "Renew Roadtax",
            "queue": "B089",
            "status": "Completed",
            "documents_requested": ["Vehicle Registration Card", "Insurance"],
            "documents_submitted": ["Vehicle Registration Card", "Insurance"],
            "handling_time_minutes": 20,
            "officer_notes": None,
            "phrases_detected": ["tolong", "roadtax"],
            "follow_up_required": False,
            "follow_up_date": None,
            "preferred_language": "BIM"
        },
        {
            "id": "VH-004",
            "user_id": "900125-14-0123",
            "location": "Klinik Kesihatan",
            "department": "Kementerian Kesihatan Malaysia",
            "datetime": "2024-12-22T08:45:00",
            "application": "Medical Checkup",
            "queue": "M045",
            "status": "Completed",
            "documents_requested": [],
            "documents_submitted": ["IC", "Medical Card"],
            "handling_time_minutes": 40,
            "officer_notes": None,
            "phrases_detected": ["terima kasih", "sihat"],
            "follow_up_required": False,
            "follow_up_date": None,
            "preferred_language": "BIM"
        },
        {
            "id": "VH-005",
            "user_id": "900125-14-0123",
            "location": "KWSP (EPF)",
            "department": "Kumpulan Wang Simpanan Pekerja",
            "datetime": "2024-12-15T14:20:00",
            "application": "Update Personal Details",
            "queue": "E102",
            "status": "Completed",
            "documents_requested": [],
            "documents_submitted": ["IC", "Marriage Certificate"],
            "handling_time_minutes": 25,
            "officer_notes": None,
            "phrases_detected": ["tolong", "update"],
            "follow_up_required": False,
            "follow_up_date": None,
            "preferred_language": "BIM"
        },
        {
            "id": "VH-006",
            "user_id": "900125-14-0123",
            "location": "Pejabat Pos",
            "department": "Pos Malaysia",
            "datetime": "2024-12-08T11:30:00",
            "application": "Parcel Collection",
            "queue": "P025",
            "status": "Completed",
            "documents_requested": [],
            "documents_submitted": ["IC", "Collection Notice"],
            "handling_time_minutes": 15,
            "officer_notes": None,
            "phrases_detected": ["terima kasih"],
            "follow_up_required": False,
            "follow_up_date": None,
            "preferred_language": "BIM"
        },
        {
            "id": "VH-007",
            "user_id": "900125-14-0123",
            "location": "LHDN",
            "department": "Lembaga Hasil Dalam Negeri",
            "datetime": "2024-11-28T09:00:00",
            "application": "Income Tax Filing",
            "queue": "T018",
            "status": "Completed",
            "documents_requested": ["EA Form", "Receipts"],
            "documents_submitted": ["EA Form", "Receipts"],
            "handling_time_minutes": 35,
            "officer_notes": None,
            "phrases_detected": ["tolong", "cukai"],
            "follow_up_required": False,
            "follow_up_date": None,
            "preferred_language": "BIM"
        },
        {
            "id": "VH-008",
            "user_id": "900125-14-0123",
            "location": "JPN",
            "department": "Jabatan Pendaftaran Negara",
            "datetime": "2024-11-20T10:45:00",
            "application": "Birth Certificate Collection",
            "queue": "N032",
            "status": "Completed",
            "documents_requested": [],
            "documents_submitted": ["IC", "Payment Receipt"],
            "handling_time_minutes": 20,
            "officer_notes": None,
            "phrases_detected": ["terima kasih"],
            "follow_up_required": False,
            "follow_up_date": None,
            "preferred_language": "BIM"
        },
        {
            "id": "VH-009",
            "user_id": "900125-14-0123",
            "location": "Majlis Bandaraya",
            "department": "Dewan Bandaraya Kuala Lumpur",
            "datetime": "2024-11-15T13:30:00",
            "application": "Pay Compound Fine",
            "queue": "C058",
            "status": "Completed",
            "documents_requested": [],
            "documents_submitted": ["IC", "Summons Notice"],
            "handling_time_minutes": 18,
            "officer_notes": None,
            "phrases_detected": ["tolong", "bayar"],
            "follow_up_required": False,
            "follow_up_date": None,
            "preferred_language": "BIM"
        },
        {
            "id": "VH-010",
            "user_id": "900125-14-0123",
            "location": "TNB",
            "department": "Tenaga Nasional Berhad",
            "datetime": "2024-11-10T15:00:00",
            "application": "Electricity Bill Payment",
            "queue": "U012",
            "status": "Completed",
            "documents_requested": [],
            "documents_submitted": ["Bill Statement"],
            "handling_time_minutes": 12,
            "officer_notes": None,
            "phrases_detected": ["terima kasih"],
            "follow_up_required": False,
            "follow_up_date": None,
            "preferred_language": "BIM"
        }
    ],
    "970512-05-1234": [  # Lim Wei Ming
        {
            "id": "VH-004",
            "user_id": "970512-05-1234",
            "location": "JPN",
            "department": "Jabatan Pendaftaran Negara",
            "datetime": "2025-01-03T10:00:00",
            "application": "IC Replacement",
            "queue": "C045",
            "status": "In Progress",
            "documents_requested": ["Police Report", "Birth Certificate"],
            "documents_submitted": ["Police Report"],
            "handling_time_minutes": 40,
            "officer_notes": "Waiting for birth certificate",
            "phrases_detected": ["tolong", "IC"],
            "follow_up_required": True,
            "follow_up_date": "2025-01-15",
            "preferred_language": "BIM"
        }
    ],
    "830901-01-0123": [  # Priya Devi
        {
            "id": "VH-005",
            "user_id": "830901-01-0123",
            "location": "Hospital",
            "department": "Hospital Kuala Lumpur",
            "datetime": "2025-01-04T08:30:00",
            "application": "Medical Checkup",
            "queue": "M012",
            "status": "Completed",
            "documents_requested": [],
            "documents_submitted": ["IC", "OKU Card"],
            "handling_time_minutes": 60,
            "officer_notes": None,
            "phrases_detected": ["terima kasih", "sihat"],
            "follow_up_required": False,
            "follow_up_date": None,
            "preferred_language": "BIM"
        },
        {
            "id": "VH-006",
            "user_id": "830901-01-0123",
            "location": "JKM",
            "department": "Jabatan Kebajikan Masyarakat",
            "datetime": "2024-12-20T11:00:00",
            "application": "OKU Card Application",
            "queue": "W008",
            "status": "Completed",
            "documents_requested": ["Medical Report", "Passport Photos"],
            "documents_submitted": ["Medical Report", "Passport Photos"],
            "handling_time_minutes": 35,
            "officer_notes": "OKU card approved, will be ready in 2 weeks",
            "phrases_detected": ["tolong", "saya", "OKU"],
            "follow_up_required": False,
            "follow_up_date": None,
            "preferred_language": "BIM"
        }
    ],
    "001231-01-0123": [  # Sarah binti Mohd
        {
            "id": "VH-007",
            "user_id": "001231-01-0123",
            "location": "LHDN",
            "department": "Lembaga Hasil Dalam Negeri",
            "datetime": "2025-01-06T09:00:00",
            "application": "Tax Filing Assistance",
            "queue": "T021",
            "status": "Pending",
            "documents_requested": ["EA Form", "Bank Statement"],
            "documents_submitted": [],
            "handling_time_minutes": None,
            "officer_notes": "Scheduled appointment",
            "phrases_detected": [],
            "follow_up_required": True,
            "follow_up_date": "2025-01-13",
            "preferred_language": "BIM"
        }
    ]
}

# Mock Departmental Logs (inter-departmental communication)
MOCK_DEPARTMENTAL_LOGS: Dict[str, List[Dict]] = {
    "900125-14-0123": [
        {
            "department": "JKM",
            "date": "2025-01-02",
            "action_type": "document_request",
            "summary": "Requested bank statement for Bantuan OKU verification",
            "related_documents": ["Bank Statement (last 3 months)"],
            "officer_department": "JKM Welfare Division"
        },
        {
            "department": "Immigration",
            "date": "2025-01-05",
            "action_type": "document_request",
            "summary": "IC copy needed for passport renewal verification",
            "related_documents": ["IC Copy (front and back)"],
            "officer_department": "Immigration Passport Unit"
        }
    ],
    "970512-05-1234": [
        {
            "department": "JPN",
            "date": "2025-01-03",
            "action_type": "document_request",
            "summary": "Birth certificate required for IC replacement",
            "related_documents": ["Birth Certificate (original or certified copy)"],
            "officer_department": "JPN Registration Division"
        }
    ],
    "830901-01-0123": [
        {
            "department": "Hospital KL",
            "date": "2025-01-04",
            "action_type": "referral",
            "summary": "Follow-up appointment scheduled for hearing assessment",
            "related_documents": [],
            "officer_department": "ENT Department"
        }
    ],
    "001231-01-0123": [
        {
            "department": "LHDN",
            "date": "2025-01-06",
            "action_type": "appointment_scheduled",
            "summary": "Tax filing assistance appointment confirmed",
            "related_documents": ["EA Form", "Bank Statement"],
            "officer_department": "LHDN Customer Service"
        }
    ]
}

@app.post("/lookup-id")
async def lookup_id(request: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Look up user profile by ID number

    Args:
        request: JSON with "id_number" field

    Returns:
        User profile information or error
    """
    try:
        id_number = request.get("id_number", "").strip().upper()
        
        if not id_number:
            raise HTTPException(
                status_code=400,
                detail="ID number is required"
            )
        
        logger.info(f"🔍 Looking up ID: {id_number}")
        
        # Look up in mock database
        profile = MOCK_USER_PROFILES.get(id_number)

        if not profile:
            # Default to Ahmad bin Abdullah profile (for demo)
            logger.warning(f"⚠️ ID {id_number} not found, defaulting to Ahmad bin Abdullah")

            # Always use Ahmad bin Abdullah's profile as default
            profile = MOCK_USER_PROFILES.get("900125-14-0123")

            # Keep the original IC number from the profile (don't replace with scanned ID)
            profile = profile.copy()
        
        logger.info(f"✅ Profile found: {profile['name']} ({profile['disability_level']})")
        
        return {
            "success": True,
            "profile": profile
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ ID lookup error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error looking up ID: {str(e)}"
        )

@app.get("/video/bim-avatar")
async def get_bim_avatar_video():
    """
    Serve the BIM Sign Language Avatar video
    """
    video_path = os.path.join(os.path.dirname(__file__), "godamlah_sign_language_avatar_demo.mp4")

    if not os.path.exists(video_path):
        raise HTTPException(
            status_code=404,
            detail="Video file not found"
        )

    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename="godamlah_sign_language_avatar_demo.mp4"
    )

# ============================================
# AI FEATURES ENDPOINTS
# ============================================

def _get_visit_history_objects(user_id: str) -> List[VisitHistory]:
    """Convert mock visit history dicts to VisitHistory objects"""
    visits_data = MOCK_VISIT_HISTORY.get(user_id, [])
    return [VisitHistory(**v) for v in visits_data]

def _get_departmental_logs(user_id: str) -> List[DepartmentalLog]:
    """Convert mock departmental logs to DepartmentalLog objects"""
    logs_data = MOCK_DEPARTMENTAL_LOGS.get(user_id, [])
    return [DepartmentalLog(**l) for l in logs_data]


@app.get("/visit-history/{user_id}")
async def get_visit_history(user_id: str) -> Dict[str, Any]:
    """
    Get visit history for a user

    Args:
        user_id: User's IC number

    Returns:
        List of visit history records
    """
    try:
        logger.info(f"📜 Fetching visit history for: {user_id}")

        # Get visit history (fallback to default user for demo)
        visits_data = MOCK_VISIT_HISTORY.get(user_id)
        if not visits_data:
            logger.warning(f"⚠️ No history for {user_id}, using default")
            visits_data = MOCK_VISIT_HISTORY.get("900125-14-0123", [])

        logger.info(f"✅ Found {len(visits_data)} visits")

        return {
            "success": True,
            "user_id": user_id,
            "visits": visits_data,
            "total": len(visits_data)
        }

    except Exception as e:
        logger.error(f"❌ Visit history error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching visit history: {str(e)}"
        )


@app.post("/predict-intent")
async def predict_intent(request: PredictIntentRequest) -> Dict[str, Any]:
    """
    Predict user's visit intent based on historical patterns

    Args:
        request: PredictIntentRequest with user_id and optional current_location

    Returns:
        Prediction result with intent, confidence, and reasoning
    """
    try:
        logger.info(f"🔮 Predicting intent for: {request.user_id}")

        # Get visit history
        visits = _get_visit_history_objects(request.user_id)
        if not visits:
            # Fallback to default user for demo
            visits = _get_visit_history_objects("900125-14-0123")

        # Generate prediction
        prediction = await prediction_engine.predict_intent(
            user_id=request.user_id,
            visits=visits,
            current_location=request.current_location
        )

        logger.info(f"✅ Prediction: {prediction.predicted_intent} ({prediction.confidence:.0%})")

        return {
            "success": True,
            "prediction": prediction.model_dump()
        }

    except Exception as e:
        logger.error(f"❌ Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error predicting intent: {str(e)}"
        )


@app.post("/generate-case-brief")
async def generate_case_brief(request: GenerateCaseBriefRequest) -> Dict[str, Any]:
    """
    Generate intelligent case brief for officers

    Args:
        request: GenerateCaseBriefRequest with user_id and optional current_location

    Returns:
        Case brief with narrative, key points, and recommendations
    """
    try:
        logger.info(f"📋 Generating case brief for: {request.user_id}")

        # Get visit history and departmental logs
        visits = _get_visit_history_objects(request.user_id)
        logs = _get_departmental_logs(request.user_id)

        if not visits:
            # Fallback to default user for demo
            visits = _get_visit_history_objects("900125-14-0123")
            logs = _get_departmental_logs("900125-14-0123")

        # Get user name for anonymization
        profile = MOCK_USER_PROFILES.get(request.user_id, {})
        user_name = profile.get("name")

        # Generate brief
        brief = await case_brief_generator.generate_brief(
            user_id=request.user_id,
            visits=visits,
            logs=logs,
            current_location=request.current_location,
            user_name=user_name
        )

        logger.info(f"✅ Brief generated with {len(brief.key_points)} key points")

        return {
            "success": True,
            "brief": brief.model_dump()
        }

    except Exception as e:
        logger.error(f"❌ Case brief error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating case brief: {str(e)}"
        )


@app.post("/generate-greeting")
async def generate_greeting(request: GenerateGreetingRequest) -> Dict[str, Any]:
    """
    Generate personalized BIM greeting for avatar chatbot

    Args:
        request: GenerateGreetingRequest with user_id and options

    Returns:
        Personalized greeting with text and quick actions
    """
    try:
        logger.info(f"👋 Generating greeting for: {request.user_id}")

        # Get visit history
        visits = _get_visit_history_objects(request.user_id)
        if not visits:
            visits = _get_visit_history_objects("900125-14-0123")

        # Optionally get prediction first
        prediction = None
        if request.include_prediction:
            prediction = await prediction_engine.predict_intent(
                user_id=request.user_id,
                visits=visits,
                current_location=request.current_location
            )

        # Generate greeting
        greeting = await greeting_generator.generate_greeting(
            user_id=request.user_id,
            visits=visits,
            prediction=prediction,
            current_location=request.current_location
        )

        logger.info(f"✅ Greeting: {greeting.greeting_text[:50]}...")

        return {
            "success": True,
            "greeting": greeting.model_dump(),
            "prediction": prediction.model_dump() if prediction else None
        }

    except Exception as e:
        logger.error(f"❌ Greeting error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating greeting: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

