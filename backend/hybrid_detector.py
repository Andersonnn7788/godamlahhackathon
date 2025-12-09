"""
Hybrid Sign Language Detector
Combines MediaPipe hand detection with Roboflow classification for optimal performance
"""
import cv2
import mediapipe as mp
import numpy as np
import io
import tempfile
import os
import hashlib
import time
from typing import Dict, Optional, Tuple, List
from PIL import Image
from inference_sdk import InferenceHTTPClient
import logging

logger = logging.getLogger(__name__)

class HybridSignDetector:
    def __init__(self, roboflow_api_key: str):
        """Initialize hybrid detector with MediaPipe and Roboflow"""
        
        # MediaPipe for hand detection
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,  # Focus on one hand for better performance
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
        # Roboflow client for sign classification
        self.roboflow_client = InferenceHTTPClient(
            api_url="https://detect.roboflow.com",
            api_key=roboflow_api_key
        )
        
        # Use only the best performing model
        self.best_model = "bim-recognition-x7qsz/10"
        
        # Cache for recent detections (improves performance)
        self.detection_cache = {}
        self.cache_ttl = 2.0  # Cache for 2 seconds
        self.max_cache_size = 50
        
        # Performance tracking
        self.last_detection_time = 0
        self.min_detection_interval = 0.1  # Minimum 100ms between detections
        
        logger.info("✅ Hybrid detector initialized with MediaPipe + Roboflow")
    
    def detect_sign_fast(self, image_data: bytes) -> Dict:
        """
        Fast hybrid sign detection pipeline:
        1. MediaPipe hand detection (local, fast)
        2. Hand region cropping (reduces image size)
        3. Cache check (avoid duplicate API calls)
        4. Single Roboflow model classification
        """
        start_time = time.time()
        
        # Rate limiting - avoid too frequent API calls
        if time.time() - self.last_detection_time < self.min_detection_interval:
            return {"success": False, "error": "Rate limited", "processing_time": 0}
        
        try:
            # Step 1: Convert bytes to OpenCV image
            image = self._bytes_to_cv2_image(image_data)
            if image is None:
                return {"success": False, "error": "Invalid image data"}
            
            # Step 2: Detect hand region with MediaPipe (fast, local)
            hand_bbox = self._detect_hand_region(image)
            if hand_bbox is None:
                logger.debug("No hand detected in image")
                return {
                    "success": False, 
                    "error": "No hand detected",
                    "processing_time": time.time() - start_time
                }
            
            # Step 3: Crop to hand region (reduces image size for API)
            cropped_hand = self._crop_to_hand_region(image, hand_bbox)
            
            # Step 4: Check cache first
            image_hash = self._hash_image(cropped_hand)
            cached_result = self._get_cached_result(image_hash)
            if cached_result:
                logger.debug("Using cached detection result")
                cached_result["processing_time"] = time.time() - start_time
                cached_result["from_cache"] = True
                return cached_result
            
            # Step 5: Single Roboflow API call on cropped image
            result = self._classify_hand_sign(cropped_hand)
            
            # Step 6: Cache the result
            if result.get("success"):
                self._cache_result(image_hash, result)
            
            # Update timing
            self.last_detection_time = time.time()
            result["processing_time"] = time.time() - start_time
            result["from_cache"] = False
            
            logger.info(f"🚀 Hybrid detection completed in {result['processing_time']:.3f}s")
            return result
            
        except Exception as e:
            logger.error(f"❌ Hybrid detection failed: {str(e)}")
            return {
                "success": False, 
                "error": str(e),
                "processing_time": time.time() - start_time
            }
    
    def _bytes_to_cv2_image(self, image_data: bytes) -> Optional[np.ndarray]:
        """Convert bytes to OpenCV image"""
        try:
            # Convert bytes to PIL Image
            pil_image = Image.open(io.BytesIO(image_data))
            
            # Convert PIL to OpenCV format
            opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            return opencv_image
        except Exception as e:
            logger.error(f"Failed to convert bytes to CV2 image: {e}")
            return None
    
    def _detect_hand_region(self, image: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """
        Detect hand region using MediaPipe
        Returns: (x, y, width, height) bounding box or None
        """
        try:
            # Convert BGR to RGB for MediaPipe
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = self.hands.process(rgb_image)
            
            if results.multi_hand_landmarks:
                # Get the first (and only) hand
                hand_landmarks = results.multi_hand_landmarks[0]
                
                # Calculate bounding box from landmarks
                h, w, _ = image.shape
                x_coords = [lm.x * w for lm in hand_landmarks.landmark]
                y_coords = [lm.y * h for lm in hand_landmarks.landmark]
                
                x_min, x_max = int(min(x_coords)), int(max(x_coords))
                y_min, y_max = int(min(y_coords)), int(max(y_coords))
                
                # Add padding around hand
                padding = 30
                x_min = max(0, x_min - padding)
                y_min = max(0, y_min - padding)
                x_max = min(w, x_max + padding)
                y_max = min(h, y_max + padding)
                
                return (x_min, y_min, x_max - x_min, y_max - y_min)
            
            return None
            
        except Exception as e:
            logger.error(f"Hand detection failed: {e}")
            return None
    
    def _crop_to_hand_region(self, image: np.ndarray, bbox: Tuple[int, int, int, int]) -> np.ndarray:
        """Crop image to hand region"""
        x, y, w, h = bbox
        cropped = image[y:y+h, x:x+w]
        
        # Resize to standard size for consistent processing
        target_size = (224, 224)  # Smaller size = faster API calls
        cropped_resized = cv2.resize(cropped, target_size)
        
        return cropped_resized
    
    def _hash_image(self, image: np.ndarray) -> str:
        """Create hash of image for caching"""
        # Convert to bytes and hash
        _, buffer = cv2.imencode('.jpg', image, [cv2.IMWRITE_JPEG_QUALITY, 70])
        image_bytes = buffer.tobytes()
        return hashlib.md5(image_bytes).hexdigest()
    
    def _get_cached_result(self, image_hash: str) -> Optional[Dict]:
        """Get cached detection result if available and not expired"""
        if image_hash in self.detection_cache:
            cached_data = self.detection_cache[image_hash]
            
            # Check if cache is still valid
            if time.time() - cached_data["timestamp"] < self.cache_ttl:
                return cached_data["result"]
            else:
                # Remove expired cache
                del self.detection_cache[image_hash]
        
        return None
    
    def _cache_result(self, image_hash: str, result: Dict):
        """Cache detection result"""
        # Clean old cache if too large
        if len(self.detection_cache) >= self.max_cache_size:
            # Remove oldest entries
            oldest_keys = sorted(
                self.detection_cache.keys(),
                key=lambda k: self.detection_cache[k]["timestamp"]
            )[:10]
            for key in oldest_keys:
                del self.detection_cache[key]
        
        # Add new cache entry
        self.detection_cache[image_hash] = {
            "result": result.copy(),
            "timestamp": time.time()
        }
    
    def _classify_hand_sign(self, cropped_hand: np.ndarray) -> Dict:
        """Classify hand sign using single Roboflow model"""
        try:
            # Convert OpenCV image to bytes for API
            _, buffer = cv2.imencode('.jpg', cropped_hand, [cv2.IMWRITE_JPEG_QUALITY, 80])
            image_bytes = buffer.tobytes()
            
            # Save to temporary file for Roboflow API
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
                temp_file.write(image_bytes)
                temp_file_path = temp_file.name
            
            try:
                # Single API call to best model
                logger.debug(f"🔍 Calling Roboflow model: {self.best_model}")
                result = self.roboflow_client.infer(temp_file_path, model_id=self.best_model)
                
                # Process result
                if "predictions" in result and result["predictions"]:
                    best_prediction = max(result["predictions"], key=lambda x: x.get("confidence", 0))
                    
                    label = best_prediction.get("class", "unknown")
                    confidence = best_prediction.get("confidence", 0.0)
                    
                    logger.info(f"✅ Detected: {label} ({confidence:.2%})")
                    
                    return {
                        "success": True,
                        "label": label,
                        "confidence": confidence,
                        "model_used": self.best_model,
                        "predictions_count": len(result["predictions"])
                    }
                else:
                    return {
                        "success": False,
                        "error": "No predictions from model",
                        "model_used": self.best_model
                    }
                    
            finally:
                # Clean up temp file
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    
        except Exception as e:
            logger.error(f"Roboflow classification failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "model_used": self.best_model
            }
    
    def get_performance_stats(self) -> Dict:
        """Get performance statistics"""
        return {
            "cache_size": len(self.detection_cache),
            "cache_hit_ratio": "N/A",  # Could be implemented with counters
            "last_detection_time": self.last_detection_time,
            "min_detection_interval": self.min_detection_interval
        }
    
    def clear_cache(self):
        """Clear detection cache"""
        self.detection_cache.clear()
        logger.info("🧹 Detection cache cleared")
