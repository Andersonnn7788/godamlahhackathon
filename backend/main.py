"""
FastAPI server for BIM Sign Language Recognition using Hybrid Detection (MediaPipe + Roboflow) + OpenAI GPT-4o-mini
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="BIM Sign Language Recognition API",
    description="API for recognizing Malaysian Sign Language (BIM) using Roboflow",
    version="1.0.0"
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

# Initialize Hybrid Detector (MediaPipe + Roboflow)
hybrid_detector = HybridSignDetector(roboflow_api_key=ROBOFLOW_API_KEY)

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Legacy Roboflow client (for fallback)
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key=ROBOFLOW_API_KEY
)

# Single best model (used by hybrid detector)
BEST_MODEL = "bim-recognition-x7qsz/10"

# Mapping from detected labels to sentences (fallback if AI is not available)
LABEL_TO_SENTENCE = {
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
        "hybrid_detector": "enabled",
        "best_model": BEST_MODEL,
        "ai_model": "gpt-4o-mini"
    }

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
    Convert sign language image to text using multiple models for comparison
    
    Args:
        file: Uploaded image file
        
    Returns:
        JSON with results from all models
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
        
        logger.info(f"Processing image with multiple models: {file.filename}")
        
        results = {}
        
        # Legacy models (for backward compatibility)
        legacy_models = {
            "primary": "bim-recognition-x7qsz/10",
            "secondary": "mysl-dfq0t/1"
        }
        
        # Run inference on legacy models
        for model_name, model_id in legacy_models.items():
            try:
                result = CLIENT.infer(temp_file_path, model_id=model_id)
                
                if "predictions" in result and result["predictions"]:
                    predictions = result["predictions"]
                    best_prediction = max(predictions, key=lambda x: x.get("confidence", 0))
                    
                    label = best_prediction.get("class", "unknown")
                    confidence = best_prediction.get("confidence", 0.0)
                    text = LABEL_TO_SENTENCE.get(label.lower(), f"Sign detected: {label}")
                    
                    results[model_name] = {
                        "success": True,
                        "label": label,
                        "text": text,
                        "confidence": confidence,
                        "model_id": model_id,
                        "prediction_count": len(predictions)
                    }
                else:
                    results[model_name] = {
                        "success": False,
                        "label": None,
                        "text": "No sign detected",
                        "confidence": 0.0,
                        "model_id": model_id,
                        "prediction_count": 0
                    }
            except Exception as e:
                logger.error(f"Error with model {model_name}: {str(e)}")
                results[model_name] = {
                    "success": False,
                    "error": str(e),
                    "model_id": model_id
                }
        
        # Legacy multi-model approach (kept for compatibility)
        # Find best result from all models
        best_result = None
        best_confidence = 0
        
        for model_name, result in results.items():
            if result.get("success") and result.get("confidence", 0) > best_confidence:
                best_result = result
                best_confidence = result.get("confidence", 0)
        
        # Use AI to interpret the recognized label into a natural sentence
        if best_result and best_result.get("success"):
            label = best_result.get("label", "")
            # Interpret with AI
            ai_interpretation = await interpret_with_ai([label])
            
            return {
                "success": True,
                "label": label,
                "text": ai_interpretation,  # AI-generated sentence
                "raw_text": best_result.get("text"),  # Original mapped text
                "confidence": best_result.get("confidence", 0),
                "model_used": best_result.get("model_id"),
                "all_model_results": results,
                "method": "legacy_multi_model"
            }
        else:
            return {
                "success": False,
                "label": None,
                "text": "No sign language detected in the image.",
                "confidence": 0.0,
                "all_model_results": results,
                "method": "legacy_multi_model"
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

