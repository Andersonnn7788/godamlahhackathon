"""
FastAPI server for BIM Sign Language Recognition using Hybrid Detection (MediaPipe + Roboflow) + OpenAI GPT-4o-mini
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
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

# Legacy Roboflow client (for fallback)
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key=ROBOFLOW_API_KEY
)

# Single best model (used by hybrid detector)
BEST_MODEL = "bim-recognition-x7qsz/10"

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

@app.post("/lookup-id")
async def lookup_id(request: Dict[str, Any]) -> Dict[str, Any]:
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
            # Randomly pick a profile from the mock database (for demo)
            import random
            logger.warning(f"⚠️ ID {id_number} not found, returning random profile")
            
            # Get all profiles and randomly select one
            all_profiles = list(MOCK_USER_PROFILES.values())
            profile = random.choice(all_profiles)
            
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
    video_path = os.path.join(os.path.dirname(__file__), "BIM_Sign_Language_Avatar_Generated.mp4")
    
    if not os.path.exists(video_path):
        raise HTTPException(
            status_code=404,
            detail="Video file not found"
        )
    
    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename="BIM_Sign_Language_Avatar_Generated.mp4"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

