// FastAPI backend API types
import { BIMGesture, GestureRecognitionResult, TranslationResult, SignLanguageFrame } from './sign-language';

// Request types
export interface DetectGestureRequest {
  frame: SignLanguageFrame;
  previousContext?: string[];
}

export interface TranslateToSignRequest {
  text: string;
  language: 'en' | 'ms'; // English or Bahasa Malaysia
  speed: 'slow' | 'normal' | 'fast';
}

export interface StreamConfig {
  fps: number;
  quality: 'low' | 'medium' | 'high';
  enableAudio: boolean;
}

// Response types
export interface DetectGestureResponse {
  success: boolean;
  data: GestureRecognitionResult;
  processingTime: number;
  error?: string;
}

export interface TranslateToSignResponse {
  success: boolean;
  data: TranslationResult;
  processingTime: number;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: number;
}

// WebSocket message types
export type WebSocketMessageType = 
  | 'gesture_frame'
  | 'gesture_result'
  | 'translation_request'
  | 'avatar_animation'
  | 'error'
  | 'ping'
  | 'pong';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: number;
  sessionId?: string;
}

// MediaPipe hand landmark structure
export interface HandLandmark {
  x: number;         // Pixel x coordinate
  y: number;         // Pixel y coordinate
  z: number;         // Depth (scaled to pixels)
  visibility?: number; // Confidence landmark is visible (0-1)
}

export interface HandLandmarks {
  coordinates: HandLandmark[];      // 21 landmarks
  connections: [number, number][];  // Pairs of indices to connect
}

// API configuration
export interface APIConfig {
  baseURL: string;
  wsURL: string;
  timeout: number;
  maxRetries: number;
}