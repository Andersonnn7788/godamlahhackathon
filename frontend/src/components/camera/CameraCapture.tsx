'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils/constants';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
  confidence: number;
  color?: string;
  modelName?: string;
}

interface CameraCaptureProps {
  onFrameCapture?: (frameData: string) => void;
  captureInterval?: number;
  className?: string;
  disabled?: boolean;
  boundingBoxes?: BoundingBox[];
  detectedLabel?: string;
  demoMode?: boolean; // New prop for demo mode
  onDemoDetection?: (detected: boolean) => void; // Callback for demo detection
  isCameraOn?: boolean; // External control for camera on/off
  onCameraToggle?: (isOn: boolean) => void; // Callback when camera state changes
}

export function CameraCapture({
  onFrameCapture,
  captureInterval = 500,  // Faster capture: 500ms = 2 FPS (was 1000ms = 1 FPS)
  className,
  disabled = false,
  boundingBoxes = [],
  detectedLabel,
  demoMode = false, // Default to false
  onDemoDetection, // Callback for demo detection
  isCameraOn: externalIsCameraOn,
  onCameraToggle,
}: CameraCaptureProps) {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoHandDetected, setDemoHandDetected] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use external control if provided, otherwise use internal state
  const cameraActive = externalIsCameraOn !== undefined ? externalIsCameraOn : isActive;

  // Auto-capture frames when camera is active
  useEffect(() => {
    // Start interval only when webcam is ready (cameraActive), not disabled, and callback exists
    if (cameraActive && !disabled && onFrameCapture && !demoMode) {
      console.log('✅ Starting frame capture interval...');
      intervalRef.current = setInterval(() => {
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
        intervalRef.current = null;
        console.log('🛑 Stopped frame capture');
      }
    };
  }, [cameraActive, disabled, onFrameCapture, captureInterval, demoMode]);

  // Demo mode: simulate hand detection with more realistic timing
  useEffect(() => {
    if (cameraActive && !disabled && demoMode) {
      console.log('🎭 Starting demo hand detection...');
      const simulateHandDetection = () => {
        setDemoHandDetected(true);
        onDemoDetection?.(true); // Notify parent that detection started
        // Show for 3 seconds (longer for better visibility)
        setTimeout(() => {
          setDemoHandDetected(false);
          onDemoDetection?.(false); // Notify parent that detection ended
        }, 3000);
      };

      // Initial detection after 5 seconds when camera starts
      const initialTimeout = setTimeout(simulateHandDetection, 5000);
      
      // Then every 6-8 seconds (more realistic timing)
      demoIntervalRef.current = setInterval(() => {
        simulateHandDetection();
      }, 6000 + Math.random() * 2000); // Random between 6-8 seconds

      return () => {
        clearTimeout(initialTimeout);
        if (demoIntervalRef.current) {
          clearInterval(demoIntervalRef.current);
          demoIntervalRef.current = null;
        }
        // Reset demo state when camera stops
        setDemoHandDetected(false);
        onDemoDetection?.(false);
      };
    }
  }, [cameraActive, disabled, demoMode, onDemoDetection]);

  // Handle webcam ready
  const handleUserMedia = () => {
    console.log('📹 Webcam is ready');
    const newActiveState = true;
    setIsActive(newActiveState);
    setError(null);
    onCameraToggle?.(newActiveState);
  };

  const handleUserMediaError = (err: string | DOMException) => {
    console.error('❌ Webcam error:', err);
    setError(typeof err === 'string' ? err : err.message);
    const newActiveState = false;
    setIsActive(newActiveState);
    onCameraToggle?.(newActiveState);
  };
  
  // Handle external camera control
  useEffect(() => {
    if (externalIsCameraOn !== undefined) {
      // External control - camera state is managed by parent
      // We just need to ensure webcam is ready when enabled
      if (externalIsCameraOn && webcamRef.current?.video) {
        setIsActive(true);
      } else if (!externalIsCameraOn) {
        setIsActive(false);
        setDemoHandDetected(false);
      }
    }
  }, [externalIsCameraOn]);

  // Draw bounding boxes on canvas overlay
  useEffect(() => {
    if (!canvasRef.current || !webcamRef.current?.video) return;

    const canvas = canvasRef.current;
    const video = webcamRef.current.video;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();
    
    // Apply horizontal flip to match mirrored video
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    // Demo mode: Draw simulated hand detection with "TOLONG SAYA"
    if (demoMode && demoHandDetected) {
      // Create a simulated hand bounding box at bottom middle
      const boxWidth = 160;
      const boxHeight = 200;
      const x1 = (canvas.width - boxWidth) / 2; // Center horizontally
      const y1 = canvas.height - boxHeight - 50; // Bottom area with some padding

      // Set box color - bright red for emergency
      ctx.strokeStyle = '#FF0000'; // Red
      ctx.lineWidth = 4;
      ctx.fillStyle = '#FF0000';

      // Draw rectangle
      ctx.strokeRect(x1, y1, boxWidth, boxHeight);

      // Save context for text
      ctx.save();
      
      // Flip text back to normal orientation
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      
      // Calculate mirrored text position for "TOLONG SAYA" - position it inside the box
      const mirroredX = canvas.width - x1 - boxWidth + 10;
      
      // Draw "TOLONG SAYA" text
      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = '#FF0000';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      
      // Draw text outline and fill
      ctx.strokeText('TOLONG SAYA', mirroredX, y1 + 25);
      ctx.fillText('TOLONG SAYA', mirroredX, y1 + 25);
      
      // Draw "HELP ME" in smaller text below
      ctx.font = 'bold 12px Arial';
      ctx.strokeText('(HELP ME)', mirroredX, y1 + 45);
      ctx.fillText('(HELP ME)', mirroredX, y1 + 45);
      
      // Restore context after text
      ctx.restore();
    }

    // Draw regular bounding boxes (when not in demo mode)
    if (!demoMode && boundingBoxes && boundingBoxes.length > 0) {
      boundingBoxes.forEach((box) => {
        // Calculate box coordinates (Roboflow uses center x,y)
        const x1 = box.x - box.width / 2;
        const y1 = box.y - box.height / 2;

        // Set box color
        const color = box.color || '#00FFD1'; // Cyan default
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.fillStyle = color;

        // Draw rectangle
        ctx.strokeRect(x1, y1, box.width, box.height);

        // Prepare label text
        const label = box.class.toUpperCase();
        const confidence = `${Math.round(box.confidence * 100)}%`;
        const labelText = `${label} ${confidence}`;
        
        ctx.font = 'bold 16px Arial';
        const textMetrics = ctx.measureText(labelText);
        const textWidth = textMetrics.width;
        const textHeight = 20;
        
        // Draw label background
        ctx.fillRect(x1, y1 - textHeight - 4, textWidth + 10, textHeight + 4);
        
        // Save context for text
        ctx.save();
        
        // Flip text back to normal orientation
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
        
        // Calculate mirrored text position
        const mirroredX = canvas.width - x1 - textWidth - 5;
        
        // Draw label text (now correctly oriented)
        ctx.fillStyle = '#000000';
        ctx.fillText(labelText, mirroredX, y1 - 8);
        
        // Restore context after text
        ctx.restore();
      });
    }

    // Draw main detected label at top center
    if (detectedLabel || (demoMode && demoHandDetected)) {
      // Save context for text
      ctx.save();
      
      // Flip text back to normal orientation
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      
      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = demoMode ? '#FF0000' : '#00FFD1';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      
      const text = demoMode && demoHandDetected ? 'TOLONG SAYA' : (detectedLabel || '').toUpperCase();
      const textMetrics = ctx.measureText(text);
      const textX = (canvas.width - textMetrics.width) / 2;
      const textY = 50;
      
      // Draw text outline
      ctx.strokeText(text, textX, textY);
      // Draw text fill
      ctx.fillText(text, textX, textY);
      
      // Restore context after text
      ctx.restore();
    }
    
    // Restore context state
    ctx.restore();
  }, [boundingBoxes, detectedLabel, cameraActive, demoMode, demoHandDetected]);

  return (
    <div className={cn('relative aspect-video bg-gray-900 rounded-lg overflow-hidden', className)}>
      {!disabled && cameraActive ? (
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
          
          {/* Canvas overlay for bounding boxes */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          />
          
          {/* Capture indicator */}
          {cameraActive && !disabled && (
            <div className="absolute top-4 left-4 z-10">
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
            <VideoOff className="mx-auto h-12 w-12 mb-2" />
            <p className="text-sm">
              {disabled ? 'Activate Deaf Mode to start' : 'Camera is off. Click "Start Camera" to begin.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
