"""
FastAPI server for BIM Sign Language Recognition using Roboflow
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from inference_sdk import InferenceHTTPClient
from PIL import Image
import tempfile
import os
import io
from typing import Dict, Any
import logging

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

# Initialize Roboflow client
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="PfNLBY9FSfXGfx9lccYk"
)

# Multiple models for better accuracy
MODELS = {
    "primary": "bim-recognition-x7qsz/10",              # BIM Recognition Model v10
    "secondary": "mysl-dfq0t/1",                        # MYSL Model (Malaysian Sign Language)
    "tertiary": "sign-language-3jtnh/1",                # Sign Language Model (Mothana)
    "quaternary": "sign-language-kqyow/1",              # Sign Language Model (Mehedi)
    "quinary": "sign-language-detection-nygkw/2",       # Sign Language Detection (Chandana)
}

# Default model
DEFAULT_MODEL = "primary"

# Mapping from detected labels to sentences
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
        "models": MODELS,
        "default_model": DEFAULT_MODEL
    }

@app.post("/sign-to-text")
async def sign_to_text(
    file: UploadFile = File(...),
    model: str = "primary"  # Options: "primary", "secondary", "tertiary", "quaternary", "quinary"
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
        
        # Validate model selection
        if model not in MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model: {model}. Choose from: {list(MODELS.keys())}"
            )
        
        model_id = MODELS[model]
        logger.info(f"Processing image: {file.filename} (size: {len(contents)} bytes) with model: {model_id}")
        
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
        "models": MODELS,
        "default": DEFAULT_MODEL,
        "descriptions": {
            "primary": "BIM Recognition Model v10 - Main Malaysian Sign Language model",
            "secondary": "MYSL Model - Alternative Malaysian Sign Language model",
            "tertiary": "Sign Language Model (Mothana) - General sign language recognition",
            "quaternary": "Sign Language Model (Mehedi) - Computer vision based sign language",
            "quinary": "Sign Language Detection (Chandana) - Advanced sign language detection"
        }
    }

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
        
        # Run inference on all models
        for model_name, model_id in MODELS.items():
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
        
        # Determine best result
        best_model = max(
            [k for k, v in results.items() if v.get("success", False)],
            key=lambda k: results[k].get("confidence", 0),
            default=None
        )
        
        return {
            "results": results,
            "best_model": best_model,
            "best_result": results.get(best_model) if best_model else None
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

