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
  translationResult: TranslationResult | null;
  isProcessing: boolean;
  processingMode: ProcessingMode;
  error: string | null;
  
  // Actions
  setCurrentGesture: (gesture: BIMGesture | null) => void;
  addRecognizedText: (text: string) => void;
  clearRecognizedText: () => void;
  setTranslationResult: (result: TranslationResult | null) => void;
  setProcessing: (isProcessing: boolean) => void;
  setProcessingMode: (mode: ProcessingMode) => void;
  setError: (error: string | null) => void;
}

export const useSignLanguageStore = create<SignLanguageState>((set) => ({
  currentGesture: null,
  recognizedText: '',
  translationResult: null,
  isProcessing: false,
  processingMode: 'local',
  error: null,

  setCurrentGesture: (gesture) => set({ currentGesture: gesture }),
  addRecognizedText: (text) =>
    set((state) => ({
      recognizedText: state.recognizedText + (state.recognizedText ? ' ' : '') + text,
    })),
  clearRecognizedText: () => set({ recognizedText: '' }),
  setTranslationResult: (result) => set({ translationResult: result }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setProcessingMode: (mode) => set({ processingMode: mode }),
  setError: (error) => set({ error }),
}));

// Custom hook for gesture detection
export function useGestureDetection() {
  const [isDetecting, setIsDetecting] = useState(false);
  const store = useSignLanguageStore();

  const detectGesture = useCallback(
    async (frameData: string) => {
      if (!frameData) return;

      setIsDetecting(true);
      store.setError(null);

      try {
        const request: DetectGestureRequest = {
          frame: {
            imageData: frameData,
            timestamp: Date.now(),
            width: 640,
            height: 480,
          },
          previousContext: store.recognizedText.split(' ').filter(Boolean),
        };

        const response = await fastapiClient.detectGesture(request);

        if (response.success && response.data) {
          store.setCurrentGesture(response.data.gesture);
          store.addRecognizedText(response.data.text);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Gesture detection failed';
        store.setError(errorMessage);
      } finally {
        setIsDetecting(false);
      }
    },
    [store]
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
