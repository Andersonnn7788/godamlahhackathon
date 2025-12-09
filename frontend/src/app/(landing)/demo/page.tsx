'use client';

import { useState, useCallback, useEffect } from 'react';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { SignLanguageAvatar } from '@/components/avatar/SignLanguageAvatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';
import { useSignLanguageStore, useGestureDetection, useSignTranslation } from '@/lib/hooks/useSignLanguage';
import { Trash2, Send, AlertCircle, CheckCircle, Fingerprint, Wifi, WifiOff } from 'lucide-react';
import axios from 'axios';

export default function DemoPage() {
  const [officerInput, setOfficerInput] = useState('');
  const [isDeafModeActive, setIsDeafModeActive] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const { detectGesture, isDetecting } = useGestureDetection();
  const { translateText, isTranslating } = useSignTranslation();
  const {
    recognizedText,
    recognizedWords,
    interpretedSentence,
    translationResult,
    currentGesture,
    processingMode,
    error,
    clearRecognizedText,
  } = useSignLanguageStore();

  // Check backend status on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        console.log('🔍 Checking backend status...');
        const response = await axios.get('http://localhost:8000/health', { 
          timeout: 10000,  // Increased timeout to 10 seconds
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        if (response.data.status === 'healthy') {
          setBackendStatus('online');
          console.log('✅ Backend is online:', response.data);
        } else {
          setBackendStatus('offline');
          console.warn('⚠️ Backend responded but not healthy:', response.data);
        }
      } catch (error) {
        setBackendStatus('offline');
        console.error('❌ Backend connection failed:', error);
        if (error.code === 'ECONNREFUSED') {
          console.error('   → Backend server is not running on port 8000');
        } else if (error.code === 'ETIMEDOUT') {
          console.error('   → Backend is taking too long to respond');
        }
      }
    };
    
    // Initial check
    checkBackend();
    
    // Retry every 5 seconds if offline
    const interval = setInterval(() => {
      if (backendStatus === 'offline') {
        checkBackend();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [backendStatus]);

  // Simulate Smart ID tap
  const handleSmartIdTap = () => {
    setIsDeafModeActive(true);
  };

  // Handle frame capture from camera
  const handleFrameCapture = useCallback(
    (frameData: string) => {
      if (!isDetecting && isDeafModeActive) {
        detectGesture(frameData);
      }
    },
    [detectGesture, isDetecting, isDeafModeActive]
  );

  // Handle officer response submission
  const handleOfficerSubmit = async () => {
    if (officerInput.trim()) {
      await translateText(officerInput, 'ms');
      setOfficerInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Demo Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                Interactive Demo
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Experience Smart ID Sign Language Communication System
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <PrivacyBadge mode={processingMode} />
              {isDeafModeActive ? (
                <Badge variant="active">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Deaf Mode ACTIVE
                </Badge>
              ) : (
                <Badge variant="default">
                  Deaf Mode Inactive
                </Badge>
              )}
              <Badge variant="primary">
                <WifiOff className="h-3.5 w-3.5" />
                Offline Mode
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Smart ID Activation Card */}
        {!isDeafModeActive && (
          <Card className="mb-8 border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 dark:border-cyan-800 dark:from-cyan-950/20 dark:to-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-6 w-6 text-cyan-600" />
                Activate Deaf Mode
              </CardTitle>
              <CardDescription>
                Tap your Smart ID card to automatically activate accessibility features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSmartIdTap}
                size="lg"
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 md:w-auto"
              >
                <Fingerprint className="h-5 w-5" />
                Simulate Smart ID Tap
              </Button>
              <p className="mt-4 text-xs text-gray-600 dark:text-gray-400">
                In production, this happens automatically when you tap your physical Smart ID card
                at the kiosk NFC reader.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Main Demo Layout - Enlarged 2 Columns */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Column 1: User Camera & Recognition - ENLARGED */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Camera</CardTitle>
                <CardDescription>Sign using Malaysian Sign Language (BIM)</CardDescription>
              </CardHeader>
              <CardContent>
                <CameraCapture
                  onFrameCapture={handleFrameCapture}
                  captureInterval={800}  // Faster: 800ms intervals for smoother detection
                  disabled={!isDeafModeActive}
                />
                {!isDeafModeActive && (
                  <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                    Camera will activate after Smart ID tap
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recognized Signs Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Recognized Signs</span>
                  <div className="flex items-center gap-2">
                    {isDetecting && (
                      <Badge variant="warning" className="animate-pulse">
                        Detecting...
                      </Badge>
                    )}
                    <Button
                      onClick={clearRecognizedText}
                      variant="ghost"
                      size="sm"
                      disabled={!recognizedText}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recognized Words */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Detected Words:
                  </p>
                  <div className="min-h-[60px] rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    {recognizedWords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {recognizedWords.map((word, index) => (
                          <Badge key={index} variant="primary" className="text-sm">
                            {word}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        {isDeafModeActive
                          ? 'Start signing...'
                          : 'Activate Deaf Mode to begin'}
                      </p>
                    )}
                  </div>
                </div>

                {/* AI Interpretation */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    🤖 AI Interpretation:
                  </p>
                  <div className="min-h-[60px] rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 p-3 border border-cyan-200 dark:border-cyan-800">
                    {interpretedSentence ? (
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {interpretedSentence}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        AI will interpret your signs into natural sentences...
                      </p>
                    )}
                  </div>
                </div>

                {currentGesture && (
                  <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Latest:
                    </span>
                    <Badge variant="primary">{currentGesture.name}</Badge>
                    <Badge variant="success">
                      {Math.round(currentGesture.confidence * 100)}% confidence
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Officer Response & System Status - COMBINED */}
          <div className="space-y-4">
            {/* Officer Input - ENLARGED */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg">Officer Response</CardTitle>
                <CardDescription>Type response in Bahasa Malaysia or English</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={officerInput}
                  onChange={(e) => setOfficerInput(e.target.value)}
                  placeholder="Contoh: Sila tunggu sebentar... / Please wait a moment..."
                  className="min-h-[200px] w-full rounded-lg border border-gray-300 bg-white p-4 text-base focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  disabled={isTranslating || !isDeafModeActive}
                />
                <Button
                  onClick={handleOfficerSubmit}
                  disabled={!officerInput.trim() || isTranslating || !isDeafModeActive}
                  className="w-full"
                  size="lg"
                >
                  <Send className="h-5 w-5" />
                  {isTranslating ? 'Translating...' : 'Convert to Sign Language'}
                </Button>
              </CardContent>
            </Card>

            <SignLanguageAvatar
              translation={translationResult}
              isAnimating={!!translationResult}
            />

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Backend API</span>
                  {backendStatus === 'checking' ? (
                    <Badge variant="default">Checking...</Badge>
                  ) : backendStatus === 'online' ? (
                    <Badge variant="success">
                      <CheckCircle className="h-3 w-3" />
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3" />
                      Offline
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Deaf Mode</span>
                  {isDeafModeActive ? (
                    <Badge variant="active">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="default">Inactive</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Camera</span>
                  <Badge variant={isDeafModeActive ? 'success' : 'default'}>
                    {isDeafModeActive ? 'Ready' : 'Standby'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Detection</span>
                  <Badge variant={isDetecting ? 'warning' : 'default'}>
                    {isDetecting ? 'Processing...' : 'Idle'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* How to Use - COMPACT */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="text-base text-blue-900 dark:text-blue-400">
                  How to Use
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-1.5 text-xs text-blue-800 dark:text-blue-300">
                  <li className="flex gap-2">
                    <span className="font-bold">1.</span>
                    <span>Tap &quot;Simulate Smart ID Tap&quot; to activate Deaf Mode</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">2.</span>
                    <span>Allow camera access and start signing in BIM</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">3.</span>
                    <span>Your gestures are recognized and converted to text</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">4.</span>
                    <span>Officer types response, which shows as sign language avatar</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Privacy Notice - COMPACT */}
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-green-900 dark:text-green-400">
                  <Wifi className="h-4 w-4" />
                  Privacy First
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-xs text-green-800 dark:text-green-300">
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>All processing happens locally on your device</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>No video data is stored or transmitted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Works completely offline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Encrypted Smart ID preferences</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}


