"""
Hand Detection Module using MediaPipe
Ensures we only detect actual hands, not random objects
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class HandDetector:
    """
    Detects hands using MediaPipe and returns bounding boxes
    Only processes regions where hands are actually detected
    """
    
    def __init__(self):
        """Initialize MediaPipe Hands"""
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,  # Detect both hands
            min_detection_confidence=0.7,
            min_tracking_confidence=0.6,
            model_complexity=1  # 0=lite, 1=full (more accurate)
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        logger.info("✅ MediaPipe Hand Detector initialized")
    
    def detect_hands(self, image: np.ndarray) -> List[Dict]:
        """
        Detect hands in image and return bounding boxes
        
        Args:
            image: BGR image from OpenCV
            
        Returns:
            List of hand detections with bounding boxes and landmarks
        """
        # Convert BGR to RGB for MediaPipe
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process image
        results = self.hands.process(rgb_image)
        
        detections = []
        
        if results.multi_hand_landmarks and results.multi_handedness:
            h, w, _ = image.shape
            
            for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                # Get hand label (Left or Right)
                hand_label = handedness.classification[0].label
                hand_confidence = handedness.classification[0].score
                
                # Calculate bounding box from landmarks
                x_coords = [lm.x * w for lm in hand_landmarks.landmark]
                y_coords = [lm.y * h for lm in hand_landmarks.landmark]
                
                x_min, x_max = int(min(x_coords)), int(max(x_coords))
                y_min, y_max = int(min(y_coords)), int(max(y_coords))
                
                # Add padding (20% of box size)
                padding_x = int((x_max - x_min) * 0.2)
                padding_y = int((y_max - y_min) * 0.2)
                
                x_min = max(0, x_min - padding_x)
                y_min = max(0, y_min - padding_y)
                x_max = min(w, x_max + padding_x)
                y_max = min(h, y_max + padding_y)
                
                # Calculate center and dimensions (Roboflow format)
                bbox_width = x_max - x_min
                bbox_height = y_max - y_min
                center_x = x_min + bbox_width / 2
                center_y = y_min + bbox_height / 2
                
                detection = {
                    'hand_label': hand_label,
                    'confidence': hand_confidence,
                    'bbox': {
                        'x': center_x,
                        'y': center_y,
                        'width': bbox_width,
                        'height': bbox_height,
                        'x_min': x_min,
                        'y_min': y_min,
                        'x_max': x_max,
                        'y_max': y_max,
                    },
                    'landmarks': hand_landmarks,
                }
                
                detections.append(detection)
                
                logger.debug(f"✋ Detected {hand_label} hand at ({center_x:.0f}, {center_y:.0f}) with {hand_confidence:.2%} confidence")
        
        return detections
    
    def crop_hand_region(self, image: np.ndarray, bbox: Dict) -> np.ndarray:
        """
        Crop hand region from image
        
        Args:
            image: BGR image
            bbox: Bounding box dict with x_min, y_min, x_max, y_max
            
        Returns:
            Cropped image of hand region
        """
        x_min = bbox['x_min']
        y_min = bbox['y_min']
        x_max = bbox['x_max']
        y_max = bbox['y_max']
        
        cropped = image[y_min:y_max, x_min:x_max]
        
        # Resize to standard size for consistency
        if cropped.shape[0] > 0 and cropped.shape[1] > 0:
            cropped = cv2.resize(cropped, (320, 320), interpolation=cv2.INTER_AREA)
        else:
            # Return black image if crop failed
            cropped = np.zeros((320, 320, 3), dtype=np.uint8)
        
        return cropped
    
    def draw_hand_boxes(self, image: np.ndarray, detections: List[Dict], 
                        sign_labels: Optional[List[str]] = None) -> np.ndarray:
        """
        Draw bounding boxes and landmarks on image
        
        Args:
            image: BGR image
            detections: List of hand detections
            sign_labels: Optional list of detected sign labels
            
        Returns:
            Image with drawn annotations
        """
        annotated_image = image.copy()
        
        for i, detection in enumerate(detections):
            bbox = detection['bbox']
            hand_label = detection['hand_label']
            
            # Draw bounding box
            x_min = bbox['x_min']
            y_min = bbox['y_min']
            x_max = bbox['x_max']
            y_max = bbox['y_max']
            
            # Color: Green for right hand, Blue for left hand
            color = (0, 255, 0) if hand_label == 'Right' else (255, 0, 0)
            
            cv2.rectangle(annotated_image, (x_min, y_min), (x_max, y_max), color, 2)
            
            # Draw hand label
            label_text = f"{hand_label} Hand"
            if sign_labels and i < len(sign_labels):
                label_text = f"{sign_labels[i]} ({hand_label})"
            
            # Draw label background
            (text_width, text_height), _ = cv2.getTextSize(
                label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
            )
            cv2.rectangle(
                annotated_image,
                (x_min, y_min - text_height - 10),
                (x_min + text_width + 10, y_min),
                color,
                -1
            )
            
            # Draw label text
            cv2.putText(
                annotated_image,
                label_text,
                (x_min + 5, y_min - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2
            )
            
            # Draw hand landmarks
            if 'landmarks' in detection:
                self.mp_drawing.draw_landmarks(
                    annotated_image,
                    detection['landmarks'],
                    self.mp_hands.HAND_CONNECTIONS,
                    self.mp_drawing_styles.get_default_hand_landmarks_style(),
                    self.mp_drawing_styles.get_default_hand_connections_style()
                )
        
        return annotated_image
    
    def __del__(self):
        """Cleanup"""
        if hasattr(self, 'hands'):
            self.hands.close()

