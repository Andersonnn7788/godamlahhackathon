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
        # Use the new MediaPipe tasks API (0.10.x)
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision
        import urllib.request
        import os

        # Download model if not exists
        model_path = os.path.join(os.path.dirname(__file__), "hand_landmarker.task")
        if not os.path.exists(model_path):
            logger.info("Downloading hand landmark detection model...")
            model_url = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
            urllib.request.urlretrieve(model_url, model_path)
            logger.info(f"Model downloaded to {model_path}")

        # Create HandLandmarker
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=2,
            min_hand_detection_confidence=0.7,
            min_hand_presence_confidence=0.6,
            min_tracking_confidence=0.6
        )
        self.detector = vision.HandLandmarker.create_from_options(options)

        logger.info("✅ MediaPipe Hand Detector initialized (v0.10.x API)")
    
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

        # Create MediaPipe Image object
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)

        # Process image
        results = self.detector.detect(mp_image)

        detections = []

        if results.hand_landmarks and results.handedness:
            h, w, _ = image.shape

            for hand_landmarks, handedness in zip(results.hand_landmarks, results.handedness):
                # Get hand label (Left or Right)
                hand_label = handedness[0].category_name
                hand_confidence = handedness[0].score

                # Calculate bounding box from landmarks
                x_coords = [lm.x * w for lm in hand_landmarks]
                y_coords = [lm.y * h for lm in hand_landmarks]

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
                    'landmarks': {
                        'coordinates': [
                            {
                                'x': lm.x * w,  # Convert normalized (0-1) to pixel coordinates
                                'y': lm.y * h,
                                'z': lm.z * w,  # Depth scaled to pixels
                                'visibility': getattr(lm, 'visibility', 1.0)
                            }
                            for lm in hand_landmarks
                        ],
                        'connections': [
                            # Palm base
                            [0,1], [0,5], [0,17], [5,9], [9,13], [13,17],
                            # Thumb
                            [1,2], [2,3], [3,4],
                            # Index
                            [5,6], [6,7], [7,8],
                            # Middle
                            [9,10], [10,11], [11,12],
                            # Ring
                            [13,14], [14,15], [15,16],
                            # Pinky
                            [17,18], [18,19], [19,20]
                        ]
                    },
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

            # Draw hand landmarks manually
            if 'landmarks' in detection:
                landmarks = detection['landmarks']
                coords = landmarks['coordinates']
                connections = landmarks['connections']

                # Draw landmarks as circles
                for coord in coords:
                    x = int(coord['x'])
                    y = int(coord['y'])
                    cv2.circle(annotated_image, (x, y), 3, (0, 255, 255), -1)

                # Draw connections as lines
                for connection in connections:
                    start_idx, end_idx = connection
                    if start_idx < len(coords) and end_idx < len(coords):
                        start = (int(coords[start_idx]['x']), int(coords[start_idx]['y']))
                        end = (int(coords[end_idx]['x']), int(coords[end_idx]['y']))
                        cv2.line(annotated_image, start, end, (255, 255, 255), 2)

        return annotated_image
    
    def __del__(self):
        """Cleanup"""
        if hasattr(self, 'detector'):
            self.detector.close()

