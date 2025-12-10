'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/constants';

interface SpeechInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function SpeechInput({
  onTranscript,
  disabled = false,
  className,
  placeholder = "Click microphone to start speaking...",
}: SpeechInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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
          // Send to backend for transcription
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch('http://localhost:8000/speech-to-text', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to transcribe audio');
          }

          const data = await response.json();
          const transcribedText = data.text || '';
          
          setTranscript(transcribedText);
          onTranscript(transcribedText);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to transcribe audio';
          setError(errorMessage);
          console.error('Transcription error:', err);
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      console.error('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Button
          onClick={toggleRecording}
          disabled={disabled || isProcessing}
          variant={isRecording ? 'danger' : 'default'}
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

      {/* Transcript Display */}
      <div className="min-h-[200px] w-full rounded-lg border border-gray-300 bg-white p-4 text-base dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
        {isRecording && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-sm font-medium">Recording...</span>
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
          <p className="text-sm text-gray-400">{placeholder}</p>
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

