// Types for Malaysian Sign Language (BIM) gestures and recognition
export interface BIMGesture {
  id: string;
  name: string;
  category: 'letter' | 'word' | 'phrase' | 'number';
  confidence: number;
  timestamp: number;
}

export interface SignLanguageFrame {
  imageData: string; // Base64 encoded image
  timestamp: number;
  width: number;
  height: number;
}

export interface GestureRecognitionResult {
  gesture: BIMGesture;
  alternativeGestures: BIMGesture[];
  text: string;
  confidence: number;
}

export interface TranslationResult {
  originalText: string;
  translatedGestures: BIMGesture[];
  avatarAnimation: AvatarAnimation;
}

export interface AvatarAnimation {
  id: string;
  gestures: AnimationFrame[];
  duration: number;
}

export interface AnimationFrame {
  gestureId: string;
  startTime: number;
  endTime: number;
  transitionDuration: number;
}

export type ProcessingMode = 'local' | 'edge' | 'server';

export interface PrivacySettings {
  processingMode: ProcessingMode;
  storeFrames: boolean;
  anonymizeData: boolean;
}
