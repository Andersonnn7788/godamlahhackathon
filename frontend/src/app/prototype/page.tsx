'use client';

import { useState, useCallback } from 'react';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { SignLanguageAvatar } from '@/components/avatar/SignLanguageAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';
import { useSignLanguageStore, useGestureDetection, useSignTranslation } from '@/lib/hooks/useSignLanguage';
import { Trash2, Send, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PrototypePage() {
  const [officerInput, setOfficerInput] = useState('');
  const { detectGesture, isDetecting } = useGestureDetection();
  const { translateText, isTranslating } = useSignTranslation();
  const {
    recognizedText,
    translationResult,
    currentGesture,
    processingMode,
    error,
    clearRecognizedText,
  } = useSignLanguageStore();

  // Handle frame capture from camera
  const handleFrameCapture = useCallback(
    (frameData: string) => {
      if (!isDetecting) {
        detectGesture(frameData);
      }
    },
    [detectGesture, isDetecting]
  );

  // Handle officer response submission
  const handleOfficerSubmit = async () => {
    if (officerInput.trim()) {
      await translateText(officerInput, 'ms');
      setOfficerInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                BIM Sign Language Interpreter
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Smart ID Card - Malaysian Sign Language Communication System
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PrivacyBadge mode={processingMode} />
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Split Screen Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: User Camera */}
          <div className="space-y-4">
            <CameraCapture
              onFrameCapture={handleFrameCapture}
              captureInterval={1500}
            />

            {/* Recognized Text Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recognized Text</span>
                  <Button
                    onClick={clearRecognizedText}
                    variant="ghost"
                    size="sm"
                    disabled={!recognizedText}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[100px] rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  {recognizedText ? (
                    <p className="text-gray-900 dark:text-gray-100">
                      {recognizedText}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Start signing to see recognized text here...
                    </p>
                  )}
                </div>
                {currentGesture && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Current Gesture:</span>
                    <span>{currentGesture.name}</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      {Math.round(currentGesture.confidence * 100)}% confidence
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Officer Response */}
          <div className="space-y-4">
            <SignLanguageAvatar
              translation={translationResult}
              isAnimating={!!translationResult}
            />

            {/* Officer Input */}
            <Card>
              <CardHeader>
                <CardTitle>Officer Response Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={officerInput}
                  onChange={(e) => setOfficerInput(e.target.value)}
                  placeholder="Type your response in Bahasa Malaysia or English..."
                  className="min-h-[100px] w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  disabled={isTranslating}
                />
                <Button
                  onClick={handleOfficerSubmit}
                  disabled={!officerInput.trim() || isTranslating}
                  className="w-full"
                >
                  <Send className="h-4 w-4" />
                  {isTranslating ? 'Translating...' : 'Convert to Sign Language'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-400">
            How It Works
          </h3>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
            <li>• <strong>Step 1:</strong> Allow camera access and start signing in Malaysian Sign Language (BIM)</li>
            <li>• <strong>Step 2:</strong> Your gestures are recognized and converted to text in real-time</li>
            <li>• <strong>Step 3:</strong> Officer types response, which is converted to sign language avatar</li>
            <li>• <strong>Privacy:</strong> All processing happens locally on your device - no video is stored</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Developed for NexG Godamlah Hackathon 2025 • Smart National ID Innovation
          </p>
        </div>
      </footer>
    </div>
  );
}


