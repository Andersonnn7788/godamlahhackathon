import { useState, useEffect, useCallback, useRef } from 'react';
import { VIDEO_CONFIG } from '@/lib/utils/constants';

export interface CameraState {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  stream: MediaStream | null;
  deviceId: string | null;
}

export interface CameraControls {
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
  captureFrame: () => string | null;
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    isActive: false,
    isLoading: false,
    error: null,
    stream: null,
    deviceId: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startCamera = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: VIDEO_CONFIG.width },
          height: { ideal: VIDEO_CONFIG.height },
          frameRate: { ideal: VIDEO_CONFIG.frameRate },
          facingMode: VIDEO_CONFIG.facingMode,
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setState({
        isActive: true,
        isLoading: false,
        error: null,
        stream,
        deviceId: stream.getVideoTracks()[0]?.getSettings().deviceId || null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
      setState((prev) => ({
        ...prev,
        isActive: false,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
      setState({
        isActive: false,
        isLoading: false,
        error: null,
        stream: null,
        deviceId: null,
      });
    }
  }, [state.stream]);

  const switchCamera = useCallback(async () => {
    stopCamera();
    await startCamera();
  }, [startCamera, stopCamera]);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.stream) {
        state.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [state.stream]);

  const controls: CameraControls = {
    startCamera,
    stopCamera,
    switchCamera,
    captureFrame,
  };

  return { state, controls, videoRef, canvasRef };
}
