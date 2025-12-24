"""
Accurate Sign Language Detector
Combines MediaPipe (hand detection) + Roboflow (sign classification)
Ensures we only classify actual hands, not random objects
"""

import cv2
import numpy as np
import tempfile
import os
import time
from typing import Dict, List, Optional
from PIL import Image
import io
import logging
from inference_sdk import InferenceHTTPClient

from hand_detector import HandDetector
from geometry_validator import GeometryValidator

logger = logging.getLogger(__name__)

class AccurateSignDetector:
    """
    Two-stage detection:
    1. MediaPipe detects hands (filters out non-hand objects)
    2. Roboflow classifies sign language on detected hands only
    """
    
    def __init__(self, roboflow_api_key: str):
        """Initialize detectors"""
        self.hand_detector = HandDetector()
        
        # Roboflow client for sign classification
        self.roboflow_client = InferenceHTTPClient(
            api_url="https://detect.roboflow.com",
            api_key=roboflow_api_key
        )
        
        # Malaysian Sign Language focused model (best performing)
        self.models = [
            {
                'id': 'bim-recognition-x7qsz/10',
                'name': 'BIM v10',
                'description': 'Bahasa Isyarat Malaysia (Primary)',
                'color': '#00FFD1',
                'priority': 1,  # Highest priority for Malaysian signs
                'boost': 1.0,   # No boost needed for single model
            },
        ]
        
        # Confidence thresholds
        self.min_hand_confidence = 0.7  # MediaPipe hand detection
        self.min_sign_confidence = 0.15  # Roboflow sign classification (15% - very low for demo to catch all signs)
        
        # Malaysian Sign Language vocabulary (prioritize these)
        self.malaysian_signs = {
            # Basic words
            'SAYA', 'AWAK', 'DIA', 'KAMI', 'MEREKA',  # Pronouns: I, you, he/she, we, they
            'TOLONG', 'TERIMA KASIH', 'MAAF', 'SELAMAT',  # Polite words: help, thank you, sorry, congratulations
            'YA', 'TIDAK', 'BOLEH', 'TAK BOLEH',  # Yes, no, can, cannot
            'APA', 'SIAPA', 'BILA', 'DI MANA', 'MENGAPA', 'BAGAIMANA',  # Question words
            'NAMA', 'UMUR', 'KERJA', 'RUMAH', 'SEKOLAH',  # Basic info: name, age, work, house, school
            'MAKAN', 'MINUM', 'TIDUR', 'BANGUN',  # Actions: eat, drink, sleep, wake up
            'PAGI', 'TENGAH HARI', 'PETANG', 'MALAM',  # Time: morning, noon, evening, night
            'HARI INI', 'SEMALAM', 'ESOK',  # Today, yesterday, tomorrow
            'BAIK', 'TIDAK BAIK', 'CANTIK', 'HODOH',  # Good, bad, beautiful, ugly
            'BESAR', 'KECIL', 'PANJANG', 'PENDEK',  # Big, small, long, short
            'MERAH', 'BIRU', 'HIJAU', 'KUNING', 'HITAM', 'PUTIH',  # Colors
            'SATU', 'DUA', 'TIGA', 'EMPAT', 'LIMA',  # Numbers 1-5
            # Common phrases
            'SELAMAT PAGI', 'SELAMAT PETANG', 'SELAMAT MALAM',  # Greetings
            'APA KHABAR', 'SIHAT', 'SAKIT',  # How are you, healthy, sick
            'LAPAR', 'KENYANG', 'HAUS',  # Hungry, full, thirsty
            'PANAS', 'SEJUK', 'HUJAN',  # Hot, cold, rain
        }

        # Geometry-based validator for hybrid detection
        self.geometry_validator = GeometryValidator()

        logger.info("✅ Accurate Sign Detector initialized")
    
    def detect_signs(self, image_bytes: bytes) -> Dict:
        """
        Detect sign language in image
        
        Args:
            image_bytes: Image data as bytes
            
        Returns:
            Detection result with hands and signs
        """
        start_time = time.time()
        
        try:
            # Step 1: Convert bytes to OpenCV image
            image = self._bytes_to_cv2(image_bytes)
            if image is None:
                return {
                    'success': False,
                    'error': 'Failed to decode image',
                    'processing_time': time.time() - start_time
                }
            
            # Step 2: Detect hands with MediaPipe
            hand_detections = self.hand_detector.detect_hands(image)
            
            if not hand_detections:
                return {
                    'success': False,
                    'message': 'No hands detected',
                    'hands': [],
                    'processing_time': time.time() - start_time
                }
            
            logger.info(f"✋ Detected {len(hand_detections)} hand(s)")
            
            # Step 3: Classify each detected hand
            sign_results = []
            all_bounding_boxes = []
            
            for hand_idx, hand_detection in enumerate(hand_detections):
                hand_label = hand_detection['hand_label']
                hand_bbox = hand_detection['bbox']
                
                # Crop hand region
                cropped_hand = self.hand_detector.crop_hand_region(image, hand_bbox)
                
                # Classify sign on this hand using all models
                sign_result = self._classify_hand_sign(cropped_hand, hand_bbox, hand_label)
                
                if sign_result['success']:
                    sign_results.append(sign_result)
                    
                    # Add bounding box for frontend
                    all_bounding_boxes.append({
                        'x': hand_bbox['x'],
                        'y': hand_bbox['y'],
                        'width': hand_bbox['width'],
                        'height': hand_bbox['height'],
                        'class': sign_result['label'],
                        'confidence': sign_result['confidence'],
                        'color': sign_result.get('color', '#00FFD1'),
                        'hand': hand_label,
                        'landmarks': hand_detection.get('landmarks', {})
                    })
            
            # Step 4: Find best overall detection
            if sign_results:
                best_result = max(sign_results, key=lambda x: x['confidence'])
                
                return {
                    'success': True,
                    'label': best_result['label'],
                    'confidence': best_result['confidence'],
                    'model_used': best_result['model_name'],
                    'hand': best_result['hand'],
                    'bounding_boxes': all_bounding_boxes,
                    'landmarks': hand_detections[0].get('landmarks', {}),
                    'all_detections': sign_results,
                    'num_hands': len(hand_detections),
                    'processing_time': time.time() - start_time
                }
            else:
                return {
                    'success': False,
                    'message': 'Hands detected but no confident sign classification',
                    'hands': [{'hand': h['hand_label'], 'bbox': h['bbox']} for h in hand_detections],
                    'bounding_boxes': [
                        {
                            'x': h['bbox']['x'],
                            'y': h['bbox']['y'],
                            'width': h['bbox']['width'],
                            'height': h['bbox']['height'],
                            'class': 'Hand',
                            'confidence': h['confidence'],
                            'color': '#00FF00' if h['hand_label'] == 'Right' else '#0000FF',
                            'hand': h['hand_label'],
                            'landmarks': h.get('landmarks', {})  # Include landmarks even without sign classification
                        }
                        for h in hand_detections
                    ],
                    'num_hands': len(hand_detections),
                    'processing_time': time.time() - start_time
                }
        
        except Exception as e:
            logger.error(f"❌ Detection failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'processing_time': time.time() - start_time
            }
    
    def _classify_hand_sign(self, cropped_hand: np.ndarray, hand_bbox: Dict, hand_label: str) -> Dict:
        """
        Classify sign language on a cropped hand image using multiple models
        
        Args:
            cropped_hand: Cropped hand image
            hand_bbox: Original bounding box
            hand_label: 'Left' or 'Right'
            
        Returns:
            Classification result
        """
        # Save cropped hand to temp file for Roboflow API
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            cv2.imwrite(temp_file.name, cropped_hand)
            temp_file_path = temp_file.name
        
        try:
            best_prediction = None
            best_confidence = 0
            best_model = None
            
            # Try each model
            for model in self.models:
                try:
                    result = self.roboflow_client.infer(temp_file_path, model_id=model['id'])
                    
                    if "predictions" in result and result["predictions"]:
                        # Get best prediction from this model
                        predictions = [p for p in result["predictions"] if p.get("confidence", 0) >= self.min_sign_confidence]
                        
                        if predictions:
                            model_best = max(predictions, key=lambda x: x.get("confidence", 0))
                            confidence = model_best.get("confidence", 0)
                            
                            # Apply model-specific confidence boost
                            boost_factor = model.get('boost', 1.0)
                            adjusted_confidence = confidence * boost_factor
                            
                            if adjusted_confidence > best_confidence:
                                best_confidence = confidence  # Use original confidence
                                best_prediction = model_best
                                best_model = model
                            
                            logger.debug(f"   {model['name']}: {model_best.get('class')} ({confidence:.2%})")
                
                except Exception as e:
                    logger.warning(f"   {model['name']}: Failed - {str(e)}")
                    continue
            
            if best_prediction and best_model:
                # Normalize label: uppercase and strip whitespace
                raw_label = best_prediction.get("class", "unknown")
                label = raw_label.strip().upper()

                logger.info(f"🔍 Raw Roboflow prediction: '{raw_label}' → Normalized: '{label}'")
                
                # Filter out false positives and English words (we want Malaysian signs)
                false_positives = [
                    'HEAR', 'EAR', 'NOISE', 'BACKGROUND', 'NONE', 'NULL',
                    'IMPORTANT', 'ENGLISH', 'AMERICAN', 'BRITISH', 'GENERAL',
                    'COMMON', 'BASIC', 'SIMPLE', 'STANDARD', 'DEFAULT'
                ]
                
                # Also filter out common English words that aren't Malaysian signs
                english_words = [
                    'THE', 'AND', 'OR', 'BUT', 'IF', 'THEN', 'WHEN', 'WHERE',
                    'WHAT', 'WHO', 'WHY', 'HOW', 'CAN', 'WILL', 'WOULD', 'SHOULD',
                    'MUST', 'MAY', 'MIGHT', 'COULD', 'DO', 'DOES', 'DID', 'HAVE',
                    'HAS', 'HAD', 'IS', 'ARE', 'WAS', 'WERE', 'BE', 'BEEN', 'BEING'
                ]
                
                if label in false_positives or label in english_words:
                    logger.warning(f"⚠️ Filtered out non-Malaysian sign: {label}")
                    return {
                        'success': False,
                        'message': f'Filtered non-Malaysian sign: {label}'
                    }
                
                # Boost confidence for known Malaysian signs
                final_confidence = best_confidence
                if label in self.malaysian_signs:
                    final_confidence = min(best_confidence * 1.15, 1.0)  # 15% boost for Malaysian signs
                    logger.info(f"🇲🇾 Malaysian sign detected: {label} (boosted to {final_confidence:.2%})")

                # Geometry-based validation (hybrid approach) - NON-BLOCKING
                # Only adjust confidence, don't reject signs (too strict for real-time demo)
                if hand_bbox.get('landmarks'):
                    landmarks = hand_bbox['landmarks']['coordinates']
                    validation = self.geometry_validator.validate_prediction(
                        landmarks, label, final_confidence
                    )

                    # Use geometry-adjusted confidence but don't reject
                    if validation['validated']:
                        final_confidence = validation['confidence']
                        logger.info(
                            f"✅ Geometry validated: {label} "
                            f"(adjusted confidence: {final_confidence:.2%})"
                        )
                    else:
                        # Still accept but with lower confidence
                        final_confidence = final_confidence * 0.8  # 20% penalty
                        logger.warning(
                            f"⚠️ Geometry mismatch for {label}: {validation['reason']} "
                            f"(accepting with reduced confidence: {final_confidence:.2%})"
                        )

                return {
                    'success': True,
                    'label': label,
                    'confidence': final_confidence,
                    'model_name': best_model['name'],
                    'color': best_model['color'],
                    'hand': hand_label,
                    'bbox': hand_bbox,
                    'is_malaysian': label in self.malaysian_signs,
                }
            else:
                return {
                    'success': False,
                    'message': 'No confident predictions from any model'
                }
        
        finally:
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    def _bytes_to_cv2(self, image_bytes: bytes) -> Optional[np.ndarray]:
        """Convert bytes to OpenCV image"""
        try:
            pil_image = Image.open(io.BytesIO(image_bytes))
            opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            return opencv_image
        except Exception as e:
            logger.error(f"Failed to convert bytes to CV2 image: {e}")
            return None

