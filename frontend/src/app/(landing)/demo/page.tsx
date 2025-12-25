'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { SignLanguageAvatar } from '@/components/avatar/SignLanguageAvatar';
import { BIMVideoPlayer } from '@/components/avatar/BIMVideoPlayer';
import { SpeechInput } from '@/components/ui/SpeechInput';
import { IDCardScanner } from '@/components/scanner/IDCardScanner';
import { UserProfile, UserProfile as UserProfileType } from '@/components/profile/UserProfile';
import { UserProfileModal } from '@/components/profile/UserProfileModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';
import { useSignLanguageStore, useGestureDetection, useSignTranslation } from '@/lib/hooks/useSignLanguage';
import { Trash2, Send, AlertCircle, CheckCircle, Fingerprint, WifiOff, Wifi, Activity, Loader2, Video, VideoOff, User, Volume2, VolumeX } from 'lucide-react';
import axios from 'axios';
import { GestureSequenceTracker } from '@/lib/utils/gestureSequenceTracker';
import { speak } from '@/lib/utils/elevenlabs';
import { CaseBrief } from '@/types/case-brief';

export default function DemoPage() {
  const [officerInput, setOfficerInput] = useState('');
  const [isDeafModeActive, setIsDeafModeActive] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [currentBoundingBoxes, setCurrentBoundingBoxes] = useState<any[]>([]);
  const [currentDetectedLabel, setCurrentDetectedLabel] = useState<string>('');
  const [movementPattern, setMovementPattern] = useState<'static' | 'moving' | 'complex'>('static');
  const [gestureConfidence, setGestureConfidence] = useState<number>(0);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoCountdown, setVideoCountdown] = useState<number>(5);
  const [isIDScanned, setIsIDScanned] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isAutoListening, setIsAutoListening] = useState(false);
  const [autoWorkflowEnabled, setAutoWorkflowEnabled] = useState(true);
  // AI Features State
  const [caseBrief, setCaseBrief] = useState<CaseBrief | null>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);
  const sequenceTracker = useRef(new GestureSequenceTracker());
  const lastSpokenSentence = useRef<string>('');
  const lastFrameCaptureCall = useRef<number>(0);
  const [currentSeriesWords, setCurrentSeriesWords] = useState<string[]>([]);
  const [lastSeriesPosition, setLastSeriesPosition] = useState<number>(-1);
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

  // Text-to-speech for recognized Malay sentence (series-based)
  useEffect(() => {
    const malaySentence = currentSeriesWords.join(' ');

    // Only speak if:
    // 1. TTS is enabled
    // 2. Series is complete (has both words: "tolong saya")
    // 3. The sentence has changed since last spoken
    // 4. Not currently speaking
    if (ttsEnabled && currentSeriesWords.length === 2 && malaySentence !== lastSpokenSentence.current && !isSpeaking) {
      lastSpokenSentence.current = malaySentence;
      setIsSpeaking(true);

      console.log('🔊 Speaking:', malaySentence);
      speak(malaySentence)
        .then(() => {
          console.log('✅ TTS completed:', malaySentence);

          // Auto-start listening for officer's response
          if (autoWorkflowEnabled && isDeafModeActive) {
            console.log('🎤 Auto-starting officer recording...');
            setIsAutoListening(true);
          }
        })
        .catch((error) => {
          console.error('❌ TTS error:', error);
          // If ElevenLabs fails, log but don't block the UI
          if (error.message.includes('API key not configured')) {
            console.warn('💡 To enable TTS, add NEXT_PUBLIC_ELEVENLABS_API_KEY to your .env.local file');
          }
        })
        .finally(() => {
          setIsSpeaking(false);
        });
    }
  }, [currentSeriesWords, ttsEnabled, isSpeaking, autoWorkflowEnabled, isDeafModeActive]);

  // Handle ID card scanned
  const handleIDScanned = useCallback(async (idNumber: string) => {
    setIsLoadingProfile(true);
    setIsLoadingBrief(true);

    try {
      console.log('🔍 Looking up ID:', idNumber);

      // Fetch profile and case brief in parallel
      const [profileResponse, briefResponse] = await Promise.all([
        axios.post('http://localhost:8000/lookup-id', {
          id_number: idNumber,
        }, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }),
        axios.post('http://localhost:8000/generate-case-brief', {
          user_id: idNumber,
          current_location: 'Government Service Center'
        }, {
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => {
          console.error('❌ Case brief fetch failed:', err);
          return null;
        })
      ]);

      // Handle profile
      if (profileResponse.data.success && profileResponse.data.profile) {
        const profile = profileResponse.data.profile;
        setUserProfile(profile);
        console.log('✅ Profile loaded:', profile.name);

        // IMMEDIATELY show profile modal
        setShowProfileModal(true);

        // Auto-activate Deaf Mode if disability includes "deaf"
        if (profile.disability_level.toLowerCase().includes('deaf')) {
          setIsDeafModeActive(true);
          console.log('✅ Deaf Mode activated automatically');
        }
      }

      // Handle case brief
      if (briefResponse?.data?.success && briefResponse.data.brief) {
        setCaseBrief(briefResponse.data.brief);
        console.log('📋 Case brief loaded');
      }

    } catch (error) {
      console.error('❌ Failed to lookup ID:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          console.error('   → Backend timeout - profile lookup took too long');
        } else if (error.code === 'ECONNREFUSED') {
          console.error('   → Backend server not responding');
        }
      }
      // For demo, still activate Deaf Mode even if lookup fails
      setIsDeafModeActive(true);
    } finally {
      setIsLoadingProfile(false);
      setIsLoadingBrief(false);
      // Hide scanner after showing "ID Scanned!" message for 2 seconds
      setTimeout(() => {
        setIsIDScanned(true);
      }, 2000);
    }
  }, []);

  // Handle frame capture from camera
  const handleFrameCapture = useCallback(
    async (imageDataUrl: string) => {
      if (!isDeafModeActive) return;

      // Throttle API calls for real-time feel
      const now = Date.now();
      const lastCall = lastFrameCaptureCall.current;
      if (now - lastCall < 500) { // Wait at least 500ms between calls for real-time detection
        console.log('⏭️ Throttling API call - waiting...');
        return;
      }
      lastFrameCaptureCall.current = now;

      try {
        console.log('🔍 Using DEMO detection (MediaPipe hand detection + mocked tolong/saya labels)...');

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

        // Call backend DEMO detection endpoint (real hand detection + mocked labels)
        const response = await axios.post(
          'http://localhost:8000/detect-demo',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 25000, // 25 seconds (MediaPipe can be slow on first run)
          }
        );
        
        console.log('📊 Backend response:', response.data);
        
        if (response.data.success) {
          const { label, confidence, bounding_boxes, hand, num_hands, series_state, position_in_series } = response.data;

          console.log(`✅ Detected: ${label} (${(confidence * 100).toFixed(1)}%) on ${hand} hand`);
          console.log(`📊 Series: position ${position_in_series}, state: ${series_state}`);

          // Update state with bounding boxes and label
          setCurrentBoundingBoxes(bounding_boxes);
          setCurrentDetectedLabel(label);

          // Series-based word accumulation
          if (position_in_series === 0) {
            // Start of new series - reset and add "tolong"
            console.log('🆕 New series starting - adding "tolong"');
            setCurrentSeriesWords(['tolong']);
            setLastSeriesPosition(0);
          } else if (position_in_series === 1) {
            // Add "saya" to complete the series (don't check lastSeriesPosition - just add it)
            console.log('➕ Adding "saya" to series');
            setCurrentSeriesWords((prev) => {
              // Only add if we don't already have it
              if (prev.length === 1 && prev[0] === 'tolong') {
                return ['tolong', 'saya'];
              }
              return prev;
            });

            // Only trigger GPT once when transitioning to position 1
            if (lastSeriesPosition !== 1) {
              // Series complete! Trigger GPT interpretation
              console.log('✅ Series complete: "tolong saya" - triggering GPT interpretation');

              // Send to GPT for interpretation
              setTimeout(async () => {
                const sentence = 'tolong saya';
                console.log('🤖 Sending to GPT-4o-mini:', sentence);
                await detectGesture(imageDataUrl);
              }, 100);
            }

            setLastSeriesPosition(1);
          } else {
            // Update position for other states
            setLastSeriesPosition(position_in_series);
          }
        } else {
          // No hands detected
          const { message, bounding_boxes, num_hands } = response.data;
          console.log(`⚠️ ${message}`);
          setCurrentBoundingBoxes(bounding_boxes || []);
          setCurrentDetectedLabel('');
          setMovementPattern('static');
        }

      } catch (error) {
        console.error('❌ Demo detection error:', error);
        if (axios.isAxiosError(error)) {
          console.error('Response:', error.response?.data);
          if (error.code === 'ECONNREFUSED') {
            console.error('Backend is not running. Please start it with: python main.py');
          } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.error('Backend timeout - MediaPipe initialization may be slow');
          }
        }
        // Clear state on error
        setCurrentBoundingBoxes([]);
        setCurrentDetectedLabel('');
      }
    },
    [isDeafModeActive]
  );


  // Handle speech transcript (manual mode)
  const handleSpeechTranscript = useCallback((text: string) => {
    setOfficerInput(text);
    // Text is set, user will click button to play video
  }, []);

  // Handle automatic transcript (auto-workflow mode)
  const handleAutoTranscript = useCallback((text: string) => {
    console.log('📝 Auto-transcript received:', text);
    setOfficerInput(text);

    if (!text || text.trim().length === 0) {
      // Empty transcription - show error and restart
      console.error('❌ Empty transcription, restarting listening in 2 seconds...');
      setTimeout(() => {
        console.log('🔄 Restarting auto-listening...');
        setIsAutoListening(true); // Restart listening
      }, 2000);
      return;
    }

    // Auto-trigger video playback (skip the manual "Convert to Sign" button)
    console.log('🎬 Auto-triggering video playback for:', text);
    setIsAutoListening(false);
    setIsLoadingVideo(true);
    setShouldPlayVideo(false);

    // Reduced countdown for faster response
    let countdown = 3;
    setVideoCountdown(countdown);

    const countdownInterval = setInterval(() => {
      countdown--;
      setVideoCountdown(countdown);
      console.log(`⏱️ Video countdown: ${countdown} seconds`);

      if (countdown === 0) {
        clearInterval(countdownInterval);
        console.log('▶️ Playing video now!');
        setIsLoadingVideo(false);
        setShouldPlayVideo(true);
        setOfficerInput('');
      }
    }, 1000);
  }, []);

  // Handle officer response submission
  const handleOfficerSubmit = async () => {
    if (officerInput.trim()) {
      // Reset and start loading
      setShouldPlayVideo(false);
      setOfficerInput('');
      setIsLoadingVideo(true);
      setVideoCountdown(5);
      
      console.log('⏱️ Starting 5-second countdown before video...');
      
      // Countdown timer
      let timeLeft = 5;
      const countdownInterval = setInterval(() => {
        timeLeft--;
        setVideoCountdown(timeLeft);
        console.log(`⏱️ Video countdown: ${timeLeft} seconds`);
        
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);
      
      // Play video after 5 seconds
      setTimeout(() => {
        console.log('▶️ 5 seconds elapsed - Playing video now');
        setIsLoadingVideo(false);
        setShouldPlayVideo(true);
      }, 5000);
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
    setCurrentSeriesWords([]);
    setLastSeriesPosition(-1);
    clearRecognizedText();
    lastSpokenSentence.current = ''; // Reset TTS tracking
    console.log('🔄 Demo reset - ready for next series');
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden">
      {/* ID Scanner Overlay */}
      {!isDeafModeActive && !isIDScanned && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="max-w-md">
            <IDCardScanner
              onIDScanned={handleIDScanned}
              disabled={isDeafModeActive}
            />
          </div>
        </div>
      )}

      {/* User Profile Modal - Shows immediately after ID scan */}
      {userProfile && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          profile={userProfile}
          caseBrief={caseBrief}
          isLoadingBrief={isLoadingBrief}
        />
      )}

      {/* Error Alert - Fixed at top */}
      {error && (
        <div className="mx-4 mt-2 rounded-lg border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-900/20 flex-shrink-0">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content - Custom Grid Layout */}
      <main className="flex-1 p-4 overflow-hidden">
        <div className="h-full grid grid-cols-3 gap-3" style={{ gridTemplateRows: '55% 45%' }}>

          {/* TOP LEFT: User Camera - Spans 2 rows */}
          <Card className="overflow-hidden flex flex-col row-span-2">
            <CardHeader className="py-2 px-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Your Camera</CardTitle>
                  <CardDescription className="text-xs">Sign using Bahasa Isyarat Malaysia (BIM)</CardDescription>
                </div>
                {isDeafModeActive && (
                  <Button
                    onClick={() => setIsCameraOn(!isCameraOn)}
                    variant={isCameraOn ? "destructive" : "default"}
                    size="sm"
                    className="h-7 text-xs"
                  >
                    {isCameraOn ? (
                      <>
                        <VideoOff className="h-3 w-3" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Video className="h-3 w-3" />
                        Start
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-2 overflow-hidden">
              <div className="h-full">
                <CameraCapture
                  onFrameCapture={handleFrameCapture}
                  captureInterval={500}
                  disabled={!isDeafModeActive || !isCameraOn}
                  boundingBoxes={currentBoundingBoxes}
                  detectedLabel={currentDetectedLabel}
                  isCameraOn={isCameraOn && isDeafModeActive}
                  onCameraToggle={(isOn) => setIsCameraOn(isOn)}
                />
              </div>
              {!isDeafModeActive && (
                <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                  Camera activates after ID scan
                </div>
              )}
            </CardContent>
          </Card>

          {/* TOP MIDDLE: Sign Language Output (Video/Avatar) */}
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm flex flex-col">
            {/* Header */}
            <div className="px-3 py-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                  Trained AI Sign Language Avatar Powered by
                </p>
                <img
                  src="data:image/png;base64,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"
                  alt="SignAvatar"
                  className="h-16 w-auto"
                />
              </div>
            </div>

            {/* Video/Avatar Content */}
            <div className="flex-1">
              {isLoadingVideo ? (
                <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 text-cyan-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Generating sign language video
                    </p>
                  </div>
                </div>
              ) : shouldPlayVideo ? (
                <BIMVideoPlayer
                  shouldPlay={shouldPlayVideo}
                  onVideoEnd={handleVideoEnd}
                  className="h-full"
                />
              ) : (
                <div className="h-full">
                  <SignLanguageAvatar
                    translation={translationResult}
                    isAnimating={!!translationResult}
                  />
                </div>
              )}
            </div>
          </div>

          {/* TOP RIGHT: Officer Controls */}
          <Card className="overflow-hidden flex flex-col">
            <CardHeader className="py-2 px-3 flex-shrink-0">
              <CardTitle className="text-sm">Officer Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-3 space-y-2 overflow-auto">

              {/* User Profile - Compact */}
              {userProfile && (
                <>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-start gap-2">
                      <Fingerprint className="h-4 w-4 text-cyan-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {userProfile.name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="primary" className="text-xs">
                            {userProfile.disability_level}
                          </Badge>
                          {userProfile.preferences?.requires_interpreter && (
                            <Badge variant="active" className="text-xs">
                              Interpreter
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {userProfile.preferences?.written_communication}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* View Full Profile Button */}
                  <Button
                    onClick={() => setShowProfileModal(true)}
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                  >
                    <User className="h-3 w-3 mr-1" />
                    View Full Profile
                  </Button>
                </>
              )}

              {/* Loading Profile */}
              {isLoadingProfile && (
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 p-2">
                  <Activity className="h-3 w-3 animate-spin" />
                  <span>Loading profile...</span>
                </div>
              )}

              {/* Officer Speech Input */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Speak Response (Malay/English):
                </p>
                <SpeechInput
                  onTranscript={autoWorkflowEnabled ? handleAutoTranscript : handleSpeechTranscript}
                  onError={(error) => {
                    console.error('❌ STT error:', error);
                    console.log('Error details:', {
                      error,
                      autoWorkflowEnabled,
                      isDeafModeActive
                    });
                    // Auto-restart listening after error
                    if (autoWorkflowEnabled) {
                      console.log('🔄 Will restart listening in 3 seconds...');
                      setTimeout(() => {
                        console.log('🔄 Restarting auto-listening now...');
                        setIsAutoListening(true);
                      }, 3000);
                    }
                  }}
                  onRecordingComplete={() => {
                    console.log('Recording completed via silence detection');
                    setIsAutoListening(false);
                  }}
                  autoStart={isAutoListening}
                  disabled={!isDeafModeActive}
                  placeholder="Say: Apa yang saya boleh bantu?"
                  silenceThreshold={-35}
                  silenceDuration={1500}
                />
                {!autoWorkflowEnabled && (
                  <Button
                    onClick={handleOfficerSubmit}
                    disabled={!officerInput.trim() || isTranslating || !isDeafModeActive || isLoadingVideo}
                    className="w-full h-9 text-sm"
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                    {isLoadingVideo ? 'Generating...' : isTranslating ? 'Converting...' : 'Convert to Sign'}
                  </Button>
                )}
              </div>

              {/* Quick Info */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 p-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-blue-900 dark:text-blue-400 font-medium">
                    How it works:
                  </p>
                  {autoWorkflowEnabled && (
                    <Badge className="text-[10px] h-4 bg-green-500 text-white">
                      AUTO
                    </Badge>
                  )}
                </div>
                <ul className="space-y-0.5 text-xs text-blue-800 dark:text-blue-300">
                  <li>1. User signs in front of camera</li>
                  <li>2. AI speaks the signs aloud</li>
                  {autoWorkflowEnabled ? (
                    <>
                      <li>3. Officer response auto-recorded</li>
                      <li>4. Video plays automatically</li>
                    </>
                  ) : (
                    <>
                      <li>3. Officer speaks response</li>
                      <li>4. Click to show as sign video</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* BOTTOM MIDDLE & RIGHT: Recognized Signs & Interpretation - Spans 2 columns */}
          <Card className="overflow-hidden flex flex-col col-span-2">
            <CardHeader className="py-2 px-3 flex-shrink-0">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Recognized Signs From Trained Model</span>
                <div className="flex items-center gap-1">
                  {isDetecting && (
                    <Badge variant="warning" className="animate-pulse text-xs">
                      Detecting
                    </Badge>
                  )}
                  {isSpeaking && (
                    <Badge variant="active" className="animate-pulse text-xs">
                      <Volume2 className="h-3 w-3 mr-1" />
                      Speaking
                    </Badge>
                  )}
                  <Button
                    onClick={() => setTtsEnabled(!ttsEnabled)}
                    variant={ttsEnabled ? "default" : "ghost"}
                    size="sm"
                    title={ttsEnabled ? "Disable TTS" : "Enable TTS"}
                    className="h-6 w-6 p-0"
                  >
                    {ttsEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                  </Button>
                  <Button
                    onClick={handleClearGesture}
                    variant="ghost"
                    size="sm"
                    disabled={currentSeriesWords.length === 0 && !currentDetectedLabel}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-3 space-y-2 overflow-auto">
              {/* Detected Words */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Detected Words (Series):
                </p>
                <div className="min-h-[40px] rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                  {currentSeriesWords.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {currentSeriesWords.map((word, index) => (
                        <Badge key={`series-${index}`} variant="primary" className="text-xs">
                          {word}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">
                      {isDeafModeActive ? 'Waiting for series...' : 'Inactive'}
                    </p>
                  )}
                </div>
              </div>

              {/* Recognized Sentence - Bilingual */}
              {currentSeriesWords.length > 0 && (
                <div className="space-y-2">
                  {/* Malay */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      AI-translated Bahasa Malaysia:
                    </p>
                    <div className="min-h-[35px] rounded-lg bg-blue-50 p-2 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {currentSeriesWords.join(' ')}
                      </p>
                    </div>
                  </div>

                  {/* English Translation */}
                  {currentSeriesWords.length === 2 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        AI English Translation:
                      </p>
                      <div className="min-h-[35px] rounded-lg bg-green-50 p-2 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          {interpretedSentence || 'Help me / Please help me'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Interpretation */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  AI Interpretation:
                </p>
                <div className="min-h-[50px] rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 p-2 border border-cyan-200 dark:border-cyan-800">
                  {interpretedSentence ? (
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {interpretedSentence}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      AI will interpret signs...
                    </p>
                  )}
                </div>
              </div>

              {/* Movement Stats */}
              {currentDetectedLabel && (
                <div className="flex flex-wrap items-center gap-1 text-xs pt-1 border-t border-gray-200 dark:border-gray-700">
                  <Badge
                    variant={movementPattern === 'static' ? 'default' : movementPattern === 'moving' ? 'warning' : 'primary'}
                    className="text-xs"
                  >
                    {movementPattern === 'static' && 'Static'}
                    {movementPattern === 'moving' && 'Moving'}
                    {movementPattern === 'complex' && 'Complex'}
                  </Badge>
                  <Badge variant="success" className="text-xs">
                    {Math.round(gestureConfidence * 100)}%
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}


