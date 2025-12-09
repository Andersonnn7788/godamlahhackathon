'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils/constants';

interface CameraCaptureProps {
  onFrameCapture?: (frameData: string) => void;
  captureInterval?: number;
  className?: string;
  disabled?: boolean;
}

export function CameraCapture({
  onFrameCapture,
  captureInterval = 500,  // Faster capture: 500ms = 2 FPS (was 1000ms = 1 FPS)
  className,
  disabled = false,
}: CameraCaptureProps) {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-capture frames when camera is active
  useEffect(() => {
    // Check if webcam is ready by checking if we have a video element
    const isWebcamReady = webcamRef.current?.video && !disabled && onFrameCapture;
    
    if (isWebcamReady) {
      console.log('✅ Starting frame capture interval...');
      intervalRef.current = setInterval(() => {
        // Capture directly from webcam
        if (webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            console.log('📸 Frame captured, sending to detection...');
            onFrameCapture(imageSrc);
          } else {
            console.warn('⚠️ Failed to capture frame from webcam');
          }
        }
      }, captureInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('🛑 Stopped frame capture');
      }
    };
  }, [webcamRef.current, onFrameCapture, captureInterval, disabled]);

  // Handle webcam ready
  const handleUserMedia = () => {
    console.log('📹 Webcam is ready');
    setIsActive(true);
    setError(null);
  };

  const handleUserMediaError = (err: string | DOMException) => {
    console.error('❌ Webcam error:', err);
    setError(typeof err === 'string' ? err : err.message);
    setIsActive(false);
  };

  return (
    <div className={cn('relative aspect-video bg-gray-900 rounded-lg overflow-hidden', className)}>
      {!disabled ? (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: 'user',
            }}
            className="h-full w-full object-cover"
            mirrored
            screenshotFormat="image/jpeg"
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
          />
          
          {/* Capture indicator */}
          {isActive && !disabled && (
            <div className="absolute top-4 left-4">
              <div className="flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                Detecting Signs
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center p-4 text-white">
                <VideoOff className="mx-auto h-12 w-12 mb-2" />
                <p className="text-sm">Camera Error</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-gray-400">
          <div className="text-center p-4">
            <Video className="mx-auto h-12 w-12 mb-2" />
            <p className="text-sm">Activate Deaf Mode to start</p>
          </div>
        </div>
      )}
    </div>
  );
}
