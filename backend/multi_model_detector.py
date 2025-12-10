"""
Multi-Model Sign Language Detector with Bounding Box Visualization
Tests multiple Roboflow models and returns all predictions with bounding boxes
"""
import cv2
import numpy as np
from inference_sdk import InferenceHTTPClient
from typing import Dict, Any, List, Tuple, Optional
import os
import base64
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MultiModelDetector:
    def __init__(self, roboflow_api_key: str = None):
        """Initialize multi-model detector with multiple Roboflow models"""
        self.api_key = roboflow_api_key or os.getenv("ROBOFLOW_API_KEY", "PfNLBY9FSfXGfx9lccYk")
        
        # Initialize Roboflow client
        self.roboflow_client = InferenceHTTPClient(
            api_url="https://detect.roboflow.com",
            api_key=self.api_key
        )
        
        # Define single best performing model
        self.models = {
            "BIM Recognition v10": {
                "model_id": "bim-recognition-x7qsz/10",
                "color": (0, 255, 0),  # Green
                "description": "Primary BIM model (best performing)"
            }
        }
        
        logger.info(f"✅ Multi-model detector initialized with {len(self.models)} models")
    
    def detect_all_models(self, image_data: bytes) -> Dict[str, Any]:
        """
        Run detection on all models and return predictions with bounding boxes
        
        Returns:
            {
                "success": bool,
                "models": {
                    "model_name": {
                        "predictions": [...],
                        "best_prediction": {...},
                        "bbox_count": int
                    }
                },
                "best_overall": {...},
                "annotated_image": base64_string
            }
        """
        try:
            # Decode image
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                return {"success": False, "error": "Could not decode image"}
            
            # Create a copy for annotation
            annotated_image = image.copy()
            
            results = {}
            all_predictions = []
            
            # Run inference on all models
            for model_name, model_info in self.models.items():
                model_id = model_info["model_id"]
                color = model_info["color"]
                
                try:
                    # Run inference
                    result = self.roboflow_client.infer(image_data, model_id=model_id)
                    
                    predictions = result.get("predictions", [])
                    
                    if predictions:
                        # Sort by confidence
                        sorted_predictions = sorted(predictions, key=lambda x: x.get("confidence", 0), reverse=True)
                        best_prediction = sorted_predictions[0]
                        
                        # Draw bounding boxes on annotated image
                        for pred in predictions:
                            self._draw_bbox(annotated_image, pred, model_name, color)
                        
                        results[model_name] = {
                            "model_id": model_id,
                            "predictions": sorted_predictions,
                            "best_prediction": {
                                "class": best_prediction.get("class", "unknown"),
                                "confidence": best_prediction.get("confidence", 0.0),
                                "x": best_prediction.get("x", 0),
                                "y": best_prediction.get("y", 0),
                                "width": best_prediction.get("width", 0),
                                "height": best_prediction.get("height", 0)
                            },
                            "bbox_count": len(predictions),
                            "color": color
                        }
                        
                        all_predictions.append({
                            "model": model_name,
                            "prediction": best_prediction,
                            "confidence": best_prediction.get("confidence", 0)
                        })
                        
                        logger.info(f"✅ {model_name}: {best_prediction.get('class')} ({best_prediction.get('confidence', 0):.2%})")
                    else:
                        results[model_name] = {
                            "model_id": model_id,
                            "predictions": [],
                            "best_prediction": None,
                            "bbox_count": 0,
                            "color": color
                        }
                        logger.info(f"⚠️  {model_name}: No predictions")
                        
                except Exception as e:
                    logger.error(f"❌ {model_name} error: {str(e)}")
                    results[model_name] = {
                        "model_id": model_id,
                        "error": str(e),
                        "predictions": [],
                        "best_prediction": None,
                        "bbox_count": 0,
                        "color": color
                    }
            
            # Find best overall prediction
            best_overall = None
            if all_predictions:
                best_overall = max(all_predictions, key=lambda x: x["confidence"])
            
            # Encode annotated image to base64
            _, buffer = cv2.imencode('.jpg', annotated_image)
            annotated_base64 = base64.b64encode(buffer).decode('utf-8')
            
            return {
                "success": True,
                "models": results,
                "best_overall": best_overall,
                "annotated_image": f"data:image/jpeg;base64,{annotated_base64}",
                "total_models": len(self.models),
                "models_with_detections": len([r for r in results.values() if r.get("bbox_count", 0) > 0])
            }
            
        except Exception as e:
            logger.error(f"❌ Multi-model detection error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _draw_bbox(self, image: np.ndarray, prediction: Dict, model_name: str, color: Tuple[int, int, int]):
        """Draw bounding box on image"""
        try:
            # Get bounding box coordinates
            x = int(prediction.get("x", 0))
            y = int(prediction.get("y", 0))
            width = int(prediction.get("width", 0))
            height = int(prediction.get("height", 0))
            
            # Calculate top-left and bottom-right corners
            x1 = int(x - width / 2)
            y1 = int(y - height / 2)
            x2 = int(x + width / 2)
            y2 = int(y + height / 2)
            
            # Draw rectangle
            cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
            
            # Prepare label
            class_name = prediction.get("class", "unknown")
            confidence = prediction.get("confidence", 0)
            label = f"{model_name[:10]}: {class_name} {confidence:.0%}"
            
            # Draw label background
            (label_width, label_height), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(image, (x1, y1 - label_height - 10), (x1 + label_width, y1), color, -1)
            
            # Draw label text
            cv2.putText(image, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
        except Exception as e:
            logger.error(f"Error drawing bbox: {str(e)}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about all available models"""
        return {
            "total_models": len(self.models),
            "models": {
                name: {
                    "model_id": info["model_id"],
                    "description": info["description"],
                    "color": info["color"]
                }
                for name, info in self.models.items()
            }
        }

