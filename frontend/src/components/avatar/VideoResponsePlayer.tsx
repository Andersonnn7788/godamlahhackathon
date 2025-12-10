'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Volume2, VolumeX, User } from 'lucide-react';
import { cn } from '@/lib/utils/constants';

interface VideoResponsePlayerProps {
  videoUrl?: string;
  shouldPlay?: boolean;
  onVideoEnd?: () => void;
  className?: string;
}

export function VideoResponsePlayer({
  videoUrl,
  shouldPlay = false,
  onVideoEnd,
  className,
}: VideoResponsePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Play video when shouldPlay changes
  useEffect(() => {
    if (shouldPlay && videoRef.current && videoUrl) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [shouldPlay, videoUrl]);

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
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="h-full w-full object-cover"
              onEnded={handleVideoEnd}
              muted={isMuted}
              playsInline
            />
          ) : (
            <div className="flex h-full items-center justify-center">
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

