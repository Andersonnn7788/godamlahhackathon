import { useState, useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { fastapiClient } from '@/lib/api/fastapi-client';
import {
  BIMGesture,
  GestureRecognitionResult,
  TranslationResult,
  ProcessingMode,
} from '@/types/sign-language';
import { DetectGestureRequest, TranslateToSignRequest } from '@/types/api';

interface SignLanguageState {
  currentGesture: BIMGesture | null;
  recognizedText: string;
  recognizedWords: string[];  // Array of recognized words
  interpretedSentence: string;  // AI-interpreted sentence
  translationResult: TranslationResult | null;
  isProcessing: boolean;
  processingMode: ProcessingMode;
  error: string | null;
  
  // Actions
  setCurrentGesture: (gesture: BIMGesture | null) => void;
  addRecognizedText: (text: string) => void;
  addRecognizedWord: (word: string, interpretation: string) => void;
  clearRecognizedText: () => void;
  setTranslationResult: (result: TranslationResult | null) => void;
  setProcessing: (isProcessing: boolean) => void;
  setProcessingMode: (mode: ProcessingMode) => void;
  setError: (error: string | null) => void;
}

export const useSignLanguageStore = create<SignLanguageState>((set) => ({
  currentGesture: null,
  recognizedText: '',
  recognizedWords: [],
  interpretedSentence: '',
  translationResult: null,
  isProcessing: false,
  processingMode: 'local',
  error: null,

  setCurrentGesture: (gesture) => set({ currentGesture: gesture }),
  addRecognizedText: (text) =>
    set((state) => ({
      recognizedText: state.recognizedText + (state.recognizedText ? ' ' : '') + text,
    })),
  addRecognizedWord: (word, interpretation) =>
    set((state) => ({
      recognizedWords: [...state.recognizedWords, word],
      interpretedSentence: interpretation,
      recognizedText: state.recognizedText + (state.recognizedText ? ' ' : '') + word,
    })),
  clearRecognizedText: () => set({ 
    recognizedText: '', 
    recognizedWords: [], 
    interpretedSentence: '' 
  }),
  setTranslationResult: (result) => set({ translationResult: result }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setProcessingMode: (mode) => set({ processingMode: mode }),
  setError: (error) => set({ error }),
}));

// Custom hook for gesture detection
export function useGestureDetection() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastProcessingTime, setLastProcessingTime] = useState(0);
  const store = useSignLanguageStore();

  const detectGesture = useCallback(
    async (frameData: string) => {
      if (!frameData) {
        console.warn('No frame data provided');
        return;
      }

      // Skip frames if still processing (avoid overwhelming backend)
      const now = Date.now();
      if (isDetecting || (now - lastProcessingTime < 500)) {
        console.log('⏭️ Skipping frame - still processing previous');
        return;
      }

      console.log('🔍 Detecting gesture with hybrid detector...');
      setIsDetecting(true);
      setLastProcessingTime(now);
      store.setError(null);

      try {
        const request: DetectGestureRequest = {
          frame: {
            imageData: frameData,
            timestamp: Date.now(),
            width: 1280,
            height: 720,
          },
          previousContext: store.recognizedText.split(' ').filter(Boolean),
        };

        console.log('📤 Sending frame to backend...');
        const response = await fastapiClient.detectGesture(request);
        console.log('📥 Backend response:', response);

        if (response.success && response.data) {
          const processingTime = response.data.processing_time || 0;
          const fromCache = response.data.from_cache ? ' (cached)' : '';
          
          console.log(`✅ Sign detected: ${response.data.gesture.name} (${Math.round(response.data.confidence * 100)}%) in ${(processingTime * 1000).toFixed(0)}ms${fromCache}`);
          console.log('🤖 AI Interpretation:', response.data.text);
          
          store.setCurrentGesture(response.data.gesture);
          // Add both the recognized word and AI interpretation
          store.addRecognizedWord(response.data.gesture.name, response.data.text);
        } else {
          console.log('⚠️ No sign detected:', response.error || 'Low confidence');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Gesture detection failed';
        console.error('❌ Gesture detection error:', errorMessage, error);
        store.setError(errorMessage);
      } finally {
        setIsDetecting(false);
      }
    },
    [store, isDetecting, lastProcessingTime]
  );

  return { detectGesture, isDetecting };
}

// Custom hook for text-to-sign translation
export function useSignTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const store = useSignLanguageStore();

  const translateText = useCallback(
    async (text: string, language: 'en' | 'ms' = 'ms') => {
      if (!text.trim()) return;

      setIsTranslating(true);
      store.setError(null);

      try {
        const request: TranslateToSignRequest = {
          text,
          language,
          speed: 'normal',
        };

        const response = await fastapiClient.translateToSign(request);

        if (response.success && response.data) {
          store.setTranslationResult(response.data);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Translation failed';
        store.setError(errorMessage);
      } finally {
        setIsTranslating(false);
      }
    },
    [store]
  );

  return { translateText, isTranslating };
}
