'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Volume2, VolumeX, User } from 'lucide-react';
import { cn } from '@/lib/utils/constants';

interface BIMVideoPlayerProps {
  shouldPlay?: boolean;
  onVideoEnd?: () => void;
  className?: string;
}

export function BIMVideoPlayer({
  shouldPlay = false,
  onVideoEnd,
  className,
}: BIMVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  // Fetch and play video when shouldPlay changes
  useEffect(() => {
    let isMounted = true;
    
    if (shouldPlay && videoRef.current) {
      const fetchAndPlayVideo = async () => {
        try {
          if (!isMounted) return;
          
          setVideoError(false);
          
          // Clean up previous blob URL if exists
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
          }
          
          // Fetch video from backend
          const response = await fetch('http://localhost:8000/video/bim-avatar');
          if (!response.ok) {
            throw new Error('Failed to fetch video from backend');
          }
          
          if (!isMounted) return;
          
          const blob = await response.blob();
          const videoUrl = URL.createObjectURL(blob);
          blobUrlRef.current = videoUrl;
          
          if (videoRef.current && isMounted) {
            // Pause any existing playback
            videoRef.current.pause();
            videoRef.current.src = videoUrl;
            
            // Wait for loadeddata event before playing
            videoRef.current.onloadeddata = async () => {
              if (videoRef.current && isMounted) {
                try {
                  await videoRef.current.play();
                  setIsPlaying(true);
                } catch (playErr) {
                  console.error('Play error:', playErr);
                  setVideoError(true);
                }
              }
            };
            
            videoRef.current.load();
          }
        } catch (err) {
          console.error('Error loading/playing video:', err);
          if (isMounted) {
            setVideoError(true);
            setIsPlaying(false);
          }
        }
      };
      
      fetchAndPlayVideo();
    }
    
    // Cleanup
    return () => {
      isMounted = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [shouldPlay]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    onVideoEnd?.();
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video error:', e);
    console.error('Video src:', videoRef.current?.src);
    console.error('Video error code:', videoRef.current?.error?.code);
    console.error('Video error message:', videoRef.current?.error?.message);
    setVideoError(true);
    setIsPlaying(false);
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Officer Response</span>
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="icon"
            title={isMuted ? 'Unmute' : 'Mute'}
            disabled={!isPlaying}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
          {!videoError ? (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              onEnded={handleVideoEnd}
              onError={handleVideoError}
              muted={isMuted}
              playsInline
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center p-4">
                <User className="mx-auto h-16 w-16 text-red-400 mb-2" />
                <p className="text-sm text-red-500 dark:text-red-400">
                  Video file not found
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Please ensure backend is running at http://localhost:8000
                </p>
              </div>
            </div>
          )}
          
          {!isPlaying && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-4">
                <User className="mx-auto h-16 w-16 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Waiting for officer response...
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

