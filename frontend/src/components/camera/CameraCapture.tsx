'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils/constants';
import { HandLandmark } from '@/types/api';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
  confidence: number;
  color?: string;
  modelName?: string;
  landmarks?: {
    coordinates: HandLandmark[];
    connections: [number, number][];
  };
}

interface CameraCaptureProps {
  onFrameCapture?: (frameData: string) => void;
  captureInterval?: number;
  className?: string;
  disabled?: boolean;
  boundingBoxes?: BoundingBox[];
  detectedLabel?: string;
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
  isCameraOn: externalIsCameraOn,
  onCameraToggle,
}: CameraCaptureProps) {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use external control if provided, otherwise use internal state
  const cameraActive = externalIsCameraOn !== undefined ? externalIsCameraOn : isActive;

  // Auto-capture frames when camera is active
  useEffect(() => {
    // Start interval only when webcam is ready (cameraActive), not disabled, and callback exists
    if (cameraActive && !disabled && onFrameCapture) {
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
  }, [cameraActive, disabled, onFrameCapture, captureInterval]);

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
      }
    }
  }, [externalIsCameraOn]);

  // Helper function to draw hand skeleton
  const drawHandSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{x: number, y: number, z: number, visibility?: number}>,
    connections: [number, number][],
    color: string = '#00FFD1'
  ) => {
    if (!landmarks || landmarks.length !== 21) {
      console.warn('Invalid landmarks - expected 21, got', landmarks?.length);
      return;
    }

    const canvas = ctx.canvas;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Helper to clamp coordinates within canvas bounds
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    ctx.save();

    // 1. Draw connections (lines between landmarks)
    ctx.strokeStyle = color;
    ctx.lineWidth = 3; // Thicker lines for better visibility
    ctx.lineCap = 'round';

    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (start && end) {
        const minVisibility = Math.min(
          start.visibility ?? 1.0,
          end.visibility ?? 1.0
        );

        if (minVisibility > 0.3) {  // Only draw if reasonably visible
          // Clamp coordinates to canvas bounds
          const startX = clamp(start.x, 0, canvasWidth);
          const startY = clamp(start.y, 0, canvasHeight);
          const endX = clamp(end.x, 0, canvasWidth);
          const endY = clamp(end.y, 0, canvasHeight);

          ctx.globalAlpha = minVisibility;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }
    });

    ctx.globalAlpha = 1.0;

    // 2. Draw landmark points (circles)
    landmarks.forEach((landmark, index) => {
      const visibility = landmark.visibility ?? 1.0;

      if (visibility > 0.3) {
        // Clamp coordinates to canvas bounds
        const x = clamp(landmark.x, 0, canvasWidth);
        const y = clamp(landmark.y, 0, canvasHeight);

        const radius = index === 0 ? 8 : 5;  // Larger points for better visibility

        ctx.fillStyle = color;
        ctx.globalAlpha = visibility;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();

        // Add white outline for better contrast
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.globalAlpha = visibility * 0.8;
        ctx.stroke();
      }
    });

    ctx.globalAlpha = 1.0;
    ctx.restore();
  };

  // Draw bounding boxes on canvas overlay
  useEffect(() => {
    if (!canvasRef.current || !webcamRef.current?.video) return;

    const canvas = canvasRef.current;
    const video = webcamRef.current.video;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video (portrait: 720x1280)
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Draw bounding boxes with hand skeletons
    if (boundingBoxes && boundingBoxes.length > 0) {
      console.log(`📦 Drawing ${boundingBoxes.length} bounding box(es)`);
      boundingBoxes.forEach((box, index) => {
        console.log(`  Box ${index}:`, {
          class: box.class,
          confidence: box.confidence,
          hasLandmarks: !!box.landmarks
        });

        // Calculate box coordinates (Roboflow uses center x,y)
        const x1 = box.x - box.width / 2;
        const y1 = box.y - box.height / 2;

        // Set box color
        const color = box.color || '#00FFD1'; // Cyan default
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.fillStyle = color;

        // Draw bounding box rectangle
        ctx.strokeRect(x1, y1, box.width, box.height);

        // Draw label on the hand with background
        const label = box.class.toUpperCase();

        ctx.font = 'bold 24px Arial';
        const textMetrics = ctx.measureText(label);
        const labelPadding = 8;

        // Position label at the top-left of the box
        const labelX = x1;
        const labelY = y1 - 10;

        // Draw label background (semi-transparent)
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(
          labelX,
          labelY - 24 - labelPadding,
          textMetrics.width + labelPadding * 2,
          28 + labelPadding
        );

        // Draw label text
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(label, labelX + labelPadding, labelY - labelPadding);

        // Draw hand skeleton if landmarks available
        if (box.landmarks && box.landmarks.coordinates) {
          console.log(`  ✋ Drawing hand skeleton with ${box.landmarks.coordinates.length} landmarks`);
          drawHandSkeleton(
            ctx,
            box.landmarks.coordinates,
            box.landmarks.connections,
            color
          );
        } else {
          console.log(`  ⚠️ No landmarks for box ${index}`);
        }
      });
    }

    // Label is now shown on bounding boxes only (removed top center display to avoid duplication)

    // Restore context state
    ctx.restore();
  }, [boundingBoxes, detectedLabel, cameraActive]);

  return (
    <div className={cn('relative h-full w-full bg-gray-900 rounded-lg overflow-hidden', className)}>
      {!disabled && cameraActive ? (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            videoConstraints={{
              width: 720,
              height: 1280,
              facingMode: 'user',
            }}
          className="h-full w-full object-contain"
          mirrored={false}
          screenshotFormat="image/jpeg"
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
        />
          
          {/* Canvas overlay for bounding boxes */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full object-contain pointer-events-none"
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
