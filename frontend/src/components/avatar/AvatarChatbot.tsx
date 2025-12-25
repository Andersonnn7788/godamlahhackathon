'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PersonalizedGreeting } from '@/types/greeting';
import { PredictionResult } from '@/types/prediction';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  MessageCircle,
  X,
  Bot,
  Sparkles,
  ChevronRight,
  Loader2,
  Brain,
  Hand,
} from 'lucide-react';

interface AvatarChatbotProps {
  greeting: PersonalizedGreeting | null;
  prediction: PredictionResult | null;
  isLoading: boolean;
  onQuickAction?: (action: string) => void;
  className?: string;
}

export function AvatarChatbot({
  greeting,
  prediction,
  isLoading,
  onQuickAction,
  className = '',
}: AvatarChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Show notification dot when greeting arrives
  useEffect(() => {
    if (greeting && !isOpen) {
      setHasNewMessage(true);
    }
  }, [greeting, isOpen]);

  // Auto-open after a delay when greeting is ready
  useEffect(() => {
    if (greeting && !isOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasNewMessage(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [greeting]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (onQuickAction) {
      onQuickAction(action);
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <AnimatePresence>
        {/* Expanded Chat Bubble */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-16 right-0 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Hand className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">SmartSign Assistant</h3>
                    <p className="text-cyan-100 text-xs">BIM Sign Language</p>
                  </div>
                </div>
                <button
                  onClick={handleToggle}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 text-cyan-500 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Analyzing your visit history...
                    </p>
                  </div>
                </div>
              ) : greeting ? (
                <div className="space-y-4">
                  {/* Greeting Message */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm p-3">
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {greeting.greeting_text}
                        </p>
                      </div>
                      {greeting.is_personalized && (
                        <div className="flex items-center gap-1 mt-1">
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          <span className="text-[10px] text-amber-600 dark:text-amber-400">
                            Personalized for you
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prediction Summary */}
                  {prediction && (
                    <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">
                          AI Prediction
                        </span>
                        <Badge variant="purple" className="text-[10px] h-5 ml-auto">
                          {Math.round(prediction.confidence * 100)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        {prediction.predicted_intent}
                      </p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  {greeting.quick_actions && greeting.quick_actions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Quick Actions
                      </p>
                      <div className="space-y-2">
                        {greeting.quick_actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickAction(action)}
                            className="w-full flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors group"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                              {action}
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No messages yet
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-[10px] text-center text-gray-400 dark:text-gray-500">
                Powered by SmartSign AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Hand className="h-6 w-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Badge */}
        {hasNewMessage && !isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-[10px] text-white font-bold">1</span>
          </motion.div>
        )}

        {/* Loading Indicator */}
        {isLoading && !isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin"
          />
        )}
      </motion.button>
    </div>
  );
}
