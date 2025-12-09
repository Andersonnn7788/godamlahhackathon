'use client';

import React, { useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { Video, VideoOff, Camera } from 'lucide-react';
import { useCamera } from '@/lib/hooks/useCamera';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils/constants';

interface CameraCaptureProps {
  onFrameCapture?: (frameData: string) => void;
  captureInterval?: number;
  className?: string;
}

export function CameraCapture({
  onFrameCapture,
  captureInterval = 1000,
  className,
}: CameraCaptureProps) {
  const { state, controls, videoRef, canvasRef } = useCamera();
  const webcamRef = useRef<Webcam>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-capture frames when camera is active
  useEffect(() => {
    if (state.isActive && onFrameCapture) {
      intervalRef.current = setInterval(() => {
        const frameData = controls.captureFrame();
        if (frameData) {
          onFrameCapture(frameData);
        }
      }, captureInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isActive, onFrameCapture, captureInterval, controls]);

  // Update video ref when webcam ref changes
  useEffect(() => {
    if (webcamRef.current?.video) {
      videoRef.current = webcamRef.current.video;
    }
  }, [webcamRef.current, videoRef]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Camera</span>
          <div className="flex gap-2">
            {!state.isActive ? (
              <Button
                onClick={controls.startCamera}
                disabled={state.isLoading}
                size="sm"
              >
                {state.isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Start Camera
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={controls.stopCamera}
                  variant="destructive"
                  size="sm"
                >
                  <VideoOff className="h-4 w-4" />
                  Stop
                </Button>
                <Button
                  onClick={controls.switchCamera}
                  variant="outline"
                  size="sm"
                >
                  <Camera className="h-4 w-4" />
                  Switch
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gray-900">
          {state.isActive && state.stream ? (
            <Webcam
              ref={webcamRef}
              audio={false}
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: 'user',
              }}
              className="h-full w-full object-cover"
              mirrored
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              {state.error ? (
                <div className="text-center p-4">
                  <VideoOff className="mx-auto h-12 w-12 mb-2" />
                  <p className="text-sm">Camera Error</p>
                  <p className="text-xs mt-1">{state.error}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Video className="mx-auto h-12 w-12 mb-2" />
                  <p className="text-sm">Camera not active</p>
                </div>
              )}
            </div>
          )}
          
          {/* Capture indicator */}
          {state.isActive && (
            <div className="absolute top-4 left-4">
              <div className="flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                Recording
              </div>
            </div>
          )}
        </div>
        
        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
