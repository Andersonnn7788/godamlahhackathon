'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, Volume2, VolumeX } from 'lucide-react';
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
    <div className={cn('relative h-full w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg', className)}>
      {/* Mute button overlay */}
      <Button
        onClick={toggleMute}
        variant="ghost"
        size="sm"
        title={isMuted ? 'Unmute' : 'Mute'}
        className="absolute top-2 right-2 z-10 h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 shadow-sm"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>

      <AnimatePresence mode="wait">
        {translation ? (
          <motion.div
            key={currentGestureIndex}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="flex h-full flex-col items-center justify-center p-4"
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
              <UserCircle className="h-24 w-24 text-blue-600 dark:text-blue-400" />

              {/* Gesture indicator */}
              {currentGesture && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white"
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
              className="mt-4 text-center"
            >
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                {translation.originalText}
              </p>
              {translation.originalText && (
                <Button
                  onClick={() => speakText(translation.originalText)}
                  disabled={isSpeaking || isMuted}
                  variant="outline"
                  size="sm"
                  className="mt-2 h-7 text-xs"
                >
                  <Volume2 className="h-3 w-3" />
                  {isSpeaking ? 'Speaking...' : 'Play Audio'}
                </Button>
              )}
            </motion.div>

            {/* Animation indicator */}
            {isAnimating && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-2 right-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white"
              >
                Animating
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <div className="text-center">
              <UserCircle className="mx-auto h-20 w-20 mb-2 opacity-50" />
              <p className="text-xs">Waiting for response...</p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
