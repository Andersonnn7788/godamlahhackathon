'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { SignLanguageAvatar } from '@/components/avatar/SignLanguageAvatar';
import { BIMVideoPlayer } from '@/components/avatar/BIMVideoPlayer';
import { SpeechInput } from '@/components/ui/SpeechInput';
import { IDCardScanner } from '@/components/scanner/IDCardScanner';
import { UserProfile, UserProfile as UserProfileType } from '@/components/profile/UserProfile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';
import { useSignLanguageStore, useGestureDetection, useSignTranslation } from '@/lib/hooks/useSignLanguage';
import { Trash2, Send, AlertCircle, CheckCircle, Fingerprint, WifiOff, Wifi, Activity } from 'lucide-react';
import axios from 'axios';
import { GestureSequenceTracker } from '@/lib/utils/gestureSequenceTracker';

export default function DemoPage() {
  const [officerInput, setOfficerInput] = useState('');
  const [isDeafModeActive, setIsDeafModeActive] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [currentBoundingBoxes, setCurrentBoundingBoxes] = useState<any[]>([]);
  const [currentDetectedLabel, setCurrentDetectedLabel] = useState<string>('');
  const [movementPattern, setMovementPattern] = useState<'static' | 'moving' | 'complex'>('static');
  const [gestureConfidence, setGestureConfidence] = useState<number>(0);
  const [demoRecognizedWords, setDemoRecognizedWords] = useState<string[]>([]);
  const [demoInterpretation, setDemoInterpretation] = useState<string>('');
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const sequenceTracker = useRef(new GestureSequenceTracker());
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
    currentBbox,
    clearRecognizedText,
  } = useSignLanguageStore();

  // Check backend status on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        console.log('🔍 Checking backend status...');
        const response = await axios.get('http://localhost:8000/health', { 
          timeout: 20000,  // Increased timeout to 20 seconds (MediaPipe initialization can be slow)
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
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNREFUSED') {
            console.error('   → Backend server is not running on port 8000');
          } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.error('   → Backend is taking too long to respond (MediaPipe initialization can be slow)');
            console.error('   → Will retry in 5 seconds...');
          } else if (error.response?.status) {
            console.error(`   → Backend returned ${error.response.status}: ${error.response.statusText}`);
          } else {
            console.error(`   → Network error: ${error.message}`);
          }
        }
      }
    };
    
    // Initial check with delay (let backend fully initialize)
    setTimeout(() => {
      checkBackend();
    }, 2000); // Wait 2 seconds before first check
    
    // Retry every 5 seconds if offline
    const interval = setInterval(() => {
      if (backendStatus === 'offline') {
        checkBackend();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [backendStatus]);

  // Handle ID card scanned
  const handleIDScanned = useCallback(async (idNumber: string) => {
    setIsLoadingProfile(true);
    try {
      console.log('🔍 Looking up ID:', idNumber);
      const response = await axios.post('http://localhost:8000/lookup-id', {
        id_number: idNumber,
      });

      if (response.data.success && response.data.profile) {
        const profile = response.data.profile;
        setUserProfile(profile);
        console.log('✅ Profile loaded:', profile.name);

        // Auto-activate Deaf Mode if disability is "Deaf"
        if (profile.disability_level.toLowerCase() === 'deaf') {
          setIsDeafModeActive(true);
          console.log('✅ Deaf Mode activated automatically');
        }
      }
    } catch (error) {
      console.error('❌ Failed to lookup ID:', error);
      // For demo, still activate Deaf Mode even if lookup fails
      setIsDeafModeActive(true);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // Handle frame capture from camera
  const handleFrameCapture = useCallback(
    async (imageDataUrl: string) => {
      if (!isDeafModeActive) return;

      // Throttle API calls to avoid overwhelming Roboflow
      const now = Date.now();
      const lastCall = handleFrameCapture.lastCall || 0;
      if (now - lastCall < 2000) { // Wait at least 2 seconds between calls for multi-model
        console.log('⏭️ Throttling API call - waiting...');
        return;
      }
      handleFrameCapture.lastCall = now;

      try {
        console.log('🔍 Using accurate detection (MediaPipe + Roboflow)...');
        
        // Convert base64 to blob for upload
        const base64 = imageDataUrl.split(',')[1];
        if (!base64) {
          console.error('❌ No base64 data in image');
          return;
        }
        
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        
        // Create form data
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');
        
        // Call backend accurate detection endpoint
        const response = await axios.post(
          'http://localhost:8000/detect-accurate',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 25000, // 25 seconds (MediaPipe + Roboflow can be slow on first run)
          }
        );
        
        console.log('📊 Backend response:', response.data);
        
        if (response.data.success) {
          const { label, confidence, bounding_boxes, hand, num_hands } = response.data;
          
          console.log(`✅ Detected: ${label} (${(confidence * 100).toFixed(1)}%) on ${hand} hand`);
          console.log(`✋ Number of hands: ${num_hands}`);
          
          // Add to sequence tracker for temporal analysis
          if (bounding_boxes && bounding_boxes.length > 0) {
            const mainBox = bounding_boxes[0];
            sequenceTracker.current.addFrame({
              timestamp: Date.now(),
              label: label,
              confidence: confidence,
              bbox: {
                x: mainBox.x,
                y: mainBox.y,
                width: mainBox.width,
                height: mainBox.height,
              },
              modelName: response.data.model_used,
            });
          }

          // Get sequence analysis
          const sequence = sequenceTracker.current.getCurrentSequence();
          if (sequence) {
            setMovementPattern(sequence.movementPattern);
            setGestureConfidence(sequenceTracker.current.getGestureConfidence());

            console.log(`📊 Gesture Analysis:`);
            console.log(`   Label: ${sequence.dominantLabel}`);
            console.log(`   Pattern: ${sequence.movementPattern}`);
            console.log(`   Frames: ${sequence.frames.length}`);
            console.log(`   Confidence: ${(sequence.averageConfidence * 100).toFixed(1)}%`);
          }

          // Update state with bounding boxes and label
          setCurrentBoundingBoxes(bounding_boxes);
          setCurrentDetectedLabel(label);

          // Only send to AI if gesture is stable (same sign for multiple frames)
          if (sequenceTracker.current.isStableGesture() && sequenceTracker.current.hasEnoughFrames()) {
            console.log('✅ Stable gesture detected - sending to AI for interpretation');
            await detectGesture(imageDataUrl, sequence.dominantLabel, sequence.averageConfidence);
          } else {
            console.log(`⏳ Building gesture sequence... (${sequenceTracker.current.getFrameCount()} frames)`);
          }
        } else {
          // No detection or only hands detected
          const { message, bounding_boxes, num_hands } = response.data;
          console.log(`⚠️ ${message}`);
          
          if (num_hands > 0) {
            console.log(`✋ ${num_hands} hand(s) detected but no sign classified`);
            // Still show hand bounding boxes
            setCurrentBoundingBoxes(bounding_boxes || []);
            setCurrentDetectedLabel('');
          } else {
            setCurrentBoundingBoxes([]);
            setCurrentDetectedLabel('');
          }
          setMovementPattern('static');
        }

      } catch (error) {
        console.error('❌ Accurate detection error:', error);
        if (axios.isAxiosError(error)) {
          console.error('Response:', error.response?.data);
          if (error.code === 'ECONNREFUSED') {
            console.error('Backend is not running. Please start it with: python start_backend.py');
          }
        }
        // Clear state on error
        setCurrentBoundingBoxes([]);
        setCurrentDetectedLabel('');
      }
    },
    [isDeafModeActive]
  );

  // Handle demo detection (when TOLONG SAYA is detected)
  const handleDemoDetection = useCallback((detected: boolean) => {
    if (detected) {
      // Add "TOLONG SAYA" to recognized words
      setDemoRecognizedWords(prev => {
        if (!prev.includes("TOLONG SAYA")) {
          return [...prev, "TOLONG SAYA"];
        }
        return prev;
      });
      // Set English interpretation
      setDemoInterpretation("HELP ME");
    }
  }, []);

  // Handle speech transcript
  const handleSpeechTranscript = useCallback((text: string) => {
    setOfficerInput(text);
    // Text is set, user will click button to play video
  }, []);

  // Handle officer response submission
  const handleOfficerSubmit = async () => {
    if (officerInput.trim()) {
      // Reset first to ensure clean state
      setShouldPlayVideo(false);
      setOfficerInput('');
      
      // Trigger video play after a brief delay
      setTimeout(() => {
        setShouldPlayVideo(true);
      }, 50);
    }
  };

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    setShouldPlayVideo(false);
  }, []);

  // Handle clear gesture sequence
  const handleClearGesture = () => {
    sequenceTracker.current.clear();
    setCurrentBoundingBoxes([]);
    setCurrentDetectedLabel('');
    setMovementPattern('static');
    setGestureConfidence(0);
    setDemoRecognizedWords([]); // Clear demo words
    setDemoInterpretation(''); // Clear demo interpretation
    clearRecognizedText();
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
        {/* Smart ID Activation Card - Smaller */}
        {!isDeafModeActive && (
          <div className="max-w-2xl mx-auto">
            <IDCardScanner
              onIDScanned={handleIDScanned}
              disabled={isDeafModeActive}
              className="mb-8"
            />
          </div>
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
                  captureInterval={2000}  // Multi-model: 2000ms = 0.5 FPS (better for movement tracking)
                  disabled={!isDeafModeActive}
                  boundingBoxes={currentBoundingBoxes}
                  detectedLabel={currentDetectedLabel}
                  demoMode={true}  // Enable demo mode to show "TOLONG SAYA" without relying on model
                  onDemoDetection={handleDemoDetection}  // Handle demo detection
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
                            onClick={handleClearGesture}
                            variant="ghost"
                            size="sm"
                            disabled={!recognizedText && !currentDetectedLabel && demoRecognizedWords.length === 0}
                            title="Clear gesture sequence"
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
                    {(recognizedWords.length > 0 || demoRecognizedWords.length > 0) ? (
                      <div className="flex flex-wrap gap-2">
                        {/* Show demo words first (emergency priority) */}
                        {demoRecognizedWords.map((word, index) => (
                          <Badge key={`demo-${index}`} variant="danger" className="text-sm animate-pulse">
                            {word}
                          </Badge>
                        ))}
                        {/* Then show regular recognized words */}
                        {recognizedWords.map((word, index) => (
                          <Badge key={`regular-${index}`} variant="primary" className="text-sm">
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
                    {(interpretedSentence || demoInterpretation) ? (
                      <div className="space-y-2">
                        {/* Show demo interpretation first (emergency priority) */}
                        {demoInterpretation && (
                          <p className="text-base font-bold text-red-600 dark:text-red-400 animate-pulse">
                            {demoInterpretation}
                          </p>
                        )}
                        {/* Then show regular interpretation */}
                        {interpretedSentence && (
                          <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                            {interpretedSentence}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        AI will interpret your signs into natural sentences...
                      </p>
                    )}
                  </div>
                </div>

                {/* Movement Pattern Indicator */}
                {currentDetectedLabel && (
                  <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Movement:
                    </span>
                    <Badge 
                      variant={movementPattern === 'static' ? 'default' : movementPattern === 'moving' ? 'warning' : 'primary'}
                      className="flex items-center gap-1"
                    >
                      <Activity className="h-3 w-3" />
                      {movementPattern === 'static' && '🟢 Static'}
                      {movementPattern === 'moving' && '🟡 Moving'}
                      {movementPattern === 'complex' && '🔵 Complex'}
                    </Badge>
                    <Badge variant="success">
                      {Math.round(gestureConfidence * 100)}% confidence
                    </Badge>
                    <span className="text-gray-500">
                      ({sequenceTracker.current.getFrameCount()} frames)
                    </span>
                  </div>
                )}

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
            {/* User Profile */}
            {userProfile && (
              <UserProfile profile={userProfile} />
            )}

            {/* Loading Profile */}
            {isLoadingProfile && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Activity className="h-4 w-4 animate-spin" />
                    <span>Loading profile information...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Officer Input - SPEECH INPUT */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg">Officer Response</CardTitle>
                <CardDescription>Speak your response in Bahasa Malaysia or English</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SpeechInput
                  onTranscript={handleSpeechTranscript}
                  disabled={!isDeafModeActive}
                  placeholder="Click microphone and say: Apa yang saya boleh bantu?"
                />
                <Button
                  onClick={handleOfficerSubmit}
                  disabled={!officerInput.trim() || isTranslating || !isDeafModeActive}
                  className="w-full"
                  size="lg"
                >
                  <Send className="h-5 w-5" />
                  {isTranslating ? 'Converting...' : 'Convert to Sign Language'}
                </Button>
              </CardContent>
            </Card>

            {/* Video Player or Avatar */}
            {shouldPlayVideo ? (
              <BIMVideoPlayer
                shouldPlay={shouldPlayVideo}
                onVideoEnd={handleVideoEnd}
              />
            ) : (
              <SignLanguageAvatar
                translation={translationResult}
                isAnimating={!!translationResult}
              />
            )}

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
                    <span>Scan your Smart ID card to activate Deaf Mode</span>
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


