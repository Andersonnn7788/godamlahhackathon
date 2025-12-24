'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/constants';

interface SpeechInputProps {
  onTranscript: (text: string) => void;
  onRecordingComplete?: () => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  silenceThreshold?: number; // Default: -50 dB
  silenceDuration?: number; // Default: 2000 ms
}

export function SpeechInput({
  onTranscript,
  onRecordingComplete,
  onError,
  autoStart = false,
  disabled = false,
  className,
  placeholder = "Click microphone to start speaking...",
  silenceThreshold = -50,
  silenceDuration = 2000,
}: SpeechInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const consecutiveSilenceFrames = useRef<number>(0);

  // Silence detection function
  const checkAudioLevel = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate RMS (Root Mean Square) for better accuracy
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);

    // Normalize to 0-1 range
    const normalized = rms / 255;

    // Update audio level for visual indicator (0-100)
    setAudioLevel(Math.min(100, normalized * 200));

    // Convert to decibels
    const db = normalized > 0 ? 20 * Math.log10(normalized) : -100;

    // Minimum recording duration before allowing silence detection (1.5 seconds)
    const minRecordingDuration = 1500;
    const recordingDuration = Date.now() - recordingStartTimeRef.current;

    // Maximum recording duration (auto-stop after 6 seconds as failsafe)
    const maxRecordingDuration = 6000;
    if (recordingDuration >= maxRecordingDuration) {
      console.log(`⏱️ Max recording duration reached (${maxRecordingDuration/1000}s), auto-stopping`);
      // Clear any existing timer first
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      stopRecording();
      return;
    }

    // Debug logging
    if (Math.random() < 0.05) { // Log 5% of frames
      console.log(`🎤 Audio: ${db.toFixed(1)}dB, Level: ${(normalized * 100).toFixed(1)}%, Frames: ${consecutiveSilenceFrames.current}`);
    }

    // Check if below silence threshold
    // Always use -30 dB (override prop for better detection)
    const effectiveThreshold = -30;

    // Silence detection - audio is considered silent when level is low
    // normalized < 0.05 means less than 5% audio level
    const isSilent = normalized < 0.05;

    // Voice detection - consider it voice if normalized > 8%
    const isVoice = normalized > 0.08;

    if (isSilent) {
      consecutiveSilenceFrames.current++;

      // Only trigger silence if:
      // 1. Minimum recording duration has passed (1.5s)
      // 2. Consistent silence for ~30 frames (about 0.5 second at 60fps - faster response)
      // 3. No existing silence timer
      if (recordingDuration >= minRecordingDuration &&
          consecutiveSilenceFrames.current >= 30 &&
          !silenceTimerRef.current) {
        console.log(`🔇 Silence detected after ${(recordingDuration/1000).toFixed(1)}s, ${consecutiveSilenceFrames.current} silent frames`);
        silenceTimerRef.current = setTimeout(() => {
          console.log('🔇 Silence confirmed, auto-stopping recording');
          stopRecording();
        }, silenceDuration || 1000); // Default 1 second confirmation
      }
    } else if (isVoice) {
      // Only reset if we detect clear voice (above 8%)
      if (consecutiveSilenceFrames.current > 10) {
        console.log(`🔊 Voice detected! (${db.toFixed(1)}dB, ${(normalized * 100).toFixed(1)}%) - resetting silence counter`);
      }
      consecutiveSilenceFrames.current = 0;

      if (silenceTimerRef.current) {
        console.log('🔊 Canceling silence timer');
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
    // Note: If audio is between 5-8%, we don't reset counter (ambiguous zone)

    // Continue monitoring
    animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context for silence detection
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 2048;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        try {
          // Send to backend for transcription with timeout
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

          console.log('📤 Sending audio to backend for transcription...');

          const response = await fetch('http://localhost:8000/speech-to-text', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Failed to transcribe audio: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          console.log('📥 Transcription response:', data);
          const transcribedText = data.text || '';

          // Check if transcription is empty
          if (!transcribedText || transcribedText.trim().length === 0) {
            const emptyError = 'No speech detected';
            setError(emptyError);
            console.warn('⚠️ Empty transcription received');
            if (onError) onError(emptyError);
          } else {
            console.log('✅ Transcription successful:', transcribedText);
            setTranscript(transcribedText);
            onTranscript(transcribedText);
          }
        } catch (err) {
          let errorMessage = 'Failed to transcribe audio';
          if (err instanceof Error) {
            if (err.name === 'AbortError') {
              errorMessage = 'Transcription timed out - please try again';
            } else {
              errorMessage = err.message;
            }
          }
          setError(errorMessage);
          console.error('❌ Transcription error:', err);
          if (onError) onError(errorMessage);
        } finally {
          setIsProcessing(false);
          // Clean up stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          // Clean up audio context
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();
      consecutiveSilenceFrames.current = 0;
      console.log('✅ Recording started, max duration: 6 seconds');
      console.log('🎤 Speak now! Waiting for your voice...');

      // Start monitoring audio levels AFTER recording has started
      // Use setTimeout to ensure state is updated first
      setTimeout(() => {
        checkAudioLevel();
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      console.error('Microphone error:', err);
      if (onError) onError(errorMessage);
    }
  };

  const stopRecording = () => {
    // Use MediaRecorder state instead of isRecording to avoid stale closure issues
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      const duration = Date.now() - recordingStartTimeRef.current;
      console.log(`⏹️ Stopping recording after ${(duration / 1000).toFixed(1)} seconds`);

      // Clean up timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Reset counters
      consecutiveSilenceFrames.current = 0;
      recordingStartTimeRef.current = 0;
      setAudioLevel(0);

      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Notify parent that recording is complete
      if (onRecordingComplete) {
        onRecordingComplete();
      }
    } else {
      console.log('⚠️ stopRecording called but recorder not in recording state:', mediaRecorderRef.current?.state);
    }
  };

  // Auto-start recording when autoStart prop becomes true
  useEffect(() => {
    if (autoStart && !isRecording && !isProcessing && !disabled) {
      console.log('🎤 Auto-starting recording...');
      const timer = setTimeout(() => {
        startRecording();
      }, 500); // Slightly longer delay to ensure audio context is ready
      return () => clearTimeout(timer);
    }
  }, [autoStart, isRecording, isProcessing, disabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Clean up stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {!autoStart && (
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleRecording}
            disabled={disabled || isProcessing}
            variant={isRecording ? 'destructive' : 'default'}
            size="lg"
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : isRecording ? (
              <>
                <MicOff className="h-5 w-5" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                Start Speaking
              </>
            )}
          </Button>
        </div>
      )}

      {/* Transcript Display */}
      <div className="min-h-[200px] w-full rounded-lg border border-gray-300 bg-white p-4 text-base dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
        {autoStart && !isRecording && !isProcessing && (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-sm font-medium">Auto-listening mode active...</span>
          </div>
        )}
        {isRecording && (
          <div className="space-y-2 mb-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-sm font-medium">{autoStart ? 'Auto-recording...' : 'Recording...'}</span>
            </div>
            {/* Audio level indicator */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {audioLevel > 5 ? '🎤 Detecting voice...' : '⚠️ No audio detected - speak louder'}
            </p>
          </div>
        )}
        {isProcessing && (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Transcribing...</span>
          </div>
        )}
        {transcript ? (
          <p className="text-gray-900 dark:text-gray-100">{transcript}</p>
        ) : (
          <p className="text-sm text-gray-400">{autoStart ? 'Waiting for officer to speak...' : placeholder}</p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

