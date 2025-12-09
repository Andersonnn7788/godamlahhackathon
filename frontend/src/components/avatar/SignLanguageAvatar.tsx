'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TranslationResult } from '@/types/sign-language';
import { cn } from '@/lib/utils/constants';

interface SignLanguageAvatarProps {
  translation: TranslationResult | null;
  isAnimating?: boolean;
  className?: string;
}

export function SignLanguageAvatar({
  translation,
  isAnimating = false,
  className,
}: SignLanguageAvatarProps) {
  const [currentGestureIndex, setCurrentGestureIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Animate through gestures
  useEffect(() => {
    if (!translation?.avatarAnimation.gestures.length || !isAnimating) {
      return;
    }

    const gestures = translation.avatarAnimation.gestures;
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % gestures.length;
      setCurrentGestureIndex(currentIndex);
    }, 2000); // Change gesture every 2 seconds

    return () => clearInterval(interval);
  }, [translation, isAnimating]);

  // Text-to-speech for officer's message
  const speakText = (text: string) => {
    if ('speechSynthesis' in window && !isMuted) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ms-MY'; // Bahasa Malaysia
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const currentGesture =
    translation?.avatarAnimation.gestures[currentGestureIndex];

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
          <AnimatePresence mode="wait">
            {translation ? (
              <motion.div
                key={currentGestureIndex}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="flex h-full flex-col items-center justify-center p-8"
              >
                {/* Avatar representation */}
                <motion.div
                  animate={
                    isAnimating
                      ? {
                          y: [0, -10, 0],
                          rotate: [0, 5, -5, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="relative"
                >
                  <UserCircle className="h-32 w-32 text-blue-600 dark:text-blue-400" />
                  
                  {/* Gesture indicator */}
                  {currentGesture && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-4 py-1 text-xs font-medium text-white"
                    >
                      {currentGesture.gestureId}
                    </motion.div>
                  )}
                </motion.div>

                {/* Text display */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8 text-center"
                >
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {translation.originalText}
                  </p>
                  {translation.originalText && (
                    <Button
                      onClick={() => speakText(translation.originalText)}
                      disabled={isSpeaking || isMuted}
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      <Volume2 className="h-4 w-4" />
                      {isSpeaking ? 'Speaking...' : 'Play Audio'}
                    </Button>
                  )}
                </motion.div>

                {/* Animation indicator */}
                {isAnimating && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-4 right-4 rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white"
                  >
                    Animating
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <div className="text-center">
                  <UserCircle className="mx-auto h-24 w-24 mb-4 opacity-50" />
                  <p className="text-sm">Waiting for officer response...</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
