"""
Geometry-based validation for BIM sign language detection
Validates Roboflow predictions using hand landmark geometry
"""
import numpy as np
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class GeometryValidator:
    """Validates sign predictions using geometric features"""

    def __init__(self):
        # Geometric rules for common BIM signs
        self.sign_rules = {
            'TOLONG': {  # Open palm
                'fingers_extended': [1, 1, 1, 1, 1],
                'hand_openness_min': 0.6,
            },
            'TERIMA KASIH': {  # Closed fist
                'fingers_extended': [0, 0, 0, 0, 0],
                'hand_openness_max': 0.3,
            },
            'SAYA': {  # Index pointing
                'fingers_extended': [0, 1, 0, 0, 0],
            },
            'YA': {  # Thumb up
                'fingers_extended': [1, 0, 0, 0, 0],
                'hand_openness_max': 0.4,
            },
            'TIDAK': {  # Index + middle
                'fingers_extended': [0, 1, 1, 0, 0],
            },
        }

    def validate_prediction(self, landmarks: List[Dict],
                           predicted_label: str,
                           confidence: float) -> Dict:
        """
        Validate if geometric features match predicted sign

        Returns:
            {
                'validated': bool,
                'confidence': float (adjusted),
                'geometry_score': float,
                'reason': str
            }
        """
        label_upper = predicted_label.upper()

        if label_upper not in self.sign_rules:
            return {
                'validated': True,
                'confidence': confidence,
                'geometry_score': 1.0,
                'reason': 'No geometric rules defined'
            }

        features = self._calculate_features(landmarks)

        if features.get('insufficient_visibility'):
            return {
                'validated': True,
                'confidence': confidence * 0.9,
                'geometry_score': 0.9,
                'reason': 'Low visibility - skipping validation'
            }

        expected = self.sign_rules[label_upper]
        geometry_score = self._calculate_match_score(features, expected)
        validated = geometry_score > 0.5
        adjusted_confidence = confidence * geometry_score

        logger.info(
            f"Geometry validation: {predicted_label} - "
            f"Score: {geometry_score:.2f}, Validated: {validated}"
        )

        return {
            'validated': validated,
            'confidence': adjusted_confidence,
            'geometry_score': geometry_score,
            'features': features,
            'reason': 'Geometry match' if validated else 'Geometry mismatch'
        }

    def _calculate_features(self, landmarks: List[Dict]) -> Dict:
        """Calculate geometric features from landmarks"""
        visible_count = sum(
            1 for lm in landmarks
            if lm.get('visibility', 1.0) > 0.5
        )

        if visible_count < 15:
            return {'insufficient_visibility': True}

        features = {
            'fingers_extended': self._get_finger_extension(landmarks),
            'hand_openness': self._calculate_hand_openness(landmarks)
        }
        return features

    def _get_finger_extension(self, landmarks: List[Dict]) -> List[int]:
        """Determine if each finger is extended (1) or bent (0)"""
        fingers = []
        finger_indices = [
            (1, 3, 4),    # Thumb
            (5, 7, 8),    # Index
            (9, 11, 12),  # Middle
            (13, 15, 16), # Ring
            (17, 19, 20)  # Pinky
        ]

        for base_idx, mid_idx, tip_idx in finger_indices:
            base = landmarks[base_idx]
            mid = landmarks[mid_idx]
            tip = landmarks[tip_idx]

            full_dist = self._distance_2d(base, tip)
            segment_dist = (
                self._distance_2d(base, mid) +
                self._distance_2d(mid, tip)
            )

            extension_ratio = full_dist / (segment_dist + 1e-6)
            fingers.append(1 if extension_ratio > 0.75 else 0)

        return fingers

    def _calculate_hand_openness(self, landmarks: List[Dict]) -> float:
        """Calculate how open the hand is (0=closed, 1=open)"""
        fingertip_indices = [4, 8, 12, 16, 20]
        fingertips = [landmarks[i] for i in fingertip_indices]

        distances = []
        for i in range(len(fingertips)):
            for j in range(i+1, len(fingertips)):
                dist = self._distance_2d(fingertips[i], fingertips[j])
                distances.append(dist)

        avg_distance = np.mean(distances) if distances else 0
        normalized = min(avg_distance / 200.0, 1.0)
        return normalized

    def _calculate_match_score(self, features: Dict, expected: Dict) -> float:
        """Calculate how well features match expected signature (0-1)"""
        scores = []

        # Finger extension matching
        if 'fingers_extended' in expected:
            expected_fingers = expected['fingers_extended']
            actual_fingers = features['fingers_extended']
            matches = sum(
                1 for e, a in zip(expected_fingers, actual_fingers)
                if e == a
            )
            finger_score = matches / 5.0
            scores.append(finger_score)

        # Hand openness range checking
        actual_openness = features['hand_openness']

        if 'hand_openness_min' in expected:
            if actual_openness >= expected['hand_openness_min']:
                scores.append(1.0)
            else:
                scores.append(actual_openness / expected['hand_openness_min'])

        if 'hand_openness_max' in expected:
            if actual_openness <= expected['hand_openness_max']:
                scores.append(1.0)
            else:
                scores.append(expected['hand_openness_max'] / actual_openness)

        return np.mean(scores) if scores else 1.0

    def _distance_2d(self, p1: Dict, p2: Dict) -> float:
        """2D Euclidean distance between landmarks"""
        dx = p1['x'] - p2['x']
        dy = p1['y'] - p2['y']
        return np.sqrt(dx*dx + dy*dy)
