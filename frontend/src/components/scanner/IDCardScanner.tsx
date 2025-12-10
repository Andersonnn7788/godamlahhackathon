'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Fingerprint, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/constants';

interface IDCardScannerProps {
  onIDScanned: (idNumber: string) => void;
  disabled?: boolean;
  className?: string;
}

// Generate Malaysian IC number in format: YYMMDD-PB-G###
function generateMalaysianIC(): string {
  // Random date of birth (YYMMDD)
  const year = Math.floor(Math.random() * 50) + 50; // 50-99 (1950-1999)
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  
  // Place of birth (PB) - 2 digits
  const placeOfBirth = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
  
  // Gender and serial number (G###) - 4 digits, first digit is gender (0-1)
  const gender = Math.floor(Math.random() * 2); // 0 or 1
  const serial = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  
  return `${year}${month}${day}-${placeOfBirth}-${gender}${serial}`;
}

export function IDCardScanner({
  onIDScanned,
  disabled = false,
  className,
}: IDCardScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedID, setScannedID] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(5);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoActivateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simple color detection for light blue ID card
  const detectLightBlueCard = (imageData: ImageData): boolean => {
    const data = imageData.data;
    let bluePixels = 0;
    let totalPixels = 0;

    // Sample pixels (check every 10th pixel for performance)
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // More sensitive light blue detection
      // Check for various shades of blue/cyan
      const isLightBlue = (
        // Classic light blue: high blue, medium green, low red
        (b > 120 && g > 80 && r < 120 && b > g && b > r) ||
        // Cyan-ish: high blue and green, low red
        (b > 100 && g > 100 && r < 80) ||
        // Sky blue: balanced blue and green, low red
        (b > 130 && g > 110 && r < 100) ||
        // Any blue dominant color
        (b > r + 30 && b > g + 20 && b > 100)
      );
      
      if (isLightBlue) {
        bluePixels++;
      }
      totalPixels++;
    }

    const bluePercentage = (bluePixels / totalPixels);
    console.log(`🔍 Blue detection: ${Math.round(bluePercentage * 100)}% blue pixels`);
    
    // If more than 15% of pixels are blue-ish, consider it a match (lowered threshold)
    return bluePercentage > 0.15;
  };

  // Simple QR/barcode detection using canvas
  const scanForCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      console.log('⚠️ Scan skipped: missing refs or not scanning');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.log('⚠️ Scan skipped: no canvas context');
      return;
    }

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log('⚠️ Scan skipped: video not ready');
      return;
    }

    try {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Check for light blue card
      if (detectLightBlueCard(imageData)) {
        console.log('🔵 Light blue card detected!');
        // For demo: Generate a mock ID number when light blue card is detected
        const mockID = generateMalaysianIC();
        
        if (mockID && mockID !== scannedID) {
          console.log('✅ New ID generated:', mockID);
          setScannedID(mockID);
          onIDScanned(mockID);
          stopScanning();
        }
      }
    } catch (err) {
      console.error('❌ Scan error:', err);
    }
  };

  const startScanning = async () => {
    try {
      setError(null);
      setScannedID(null);
      setIsCameraActive(true); // Show video element immediately
      console.log('🎥 Requesting camera access...');

      // Try different camera configurations
      let stream: MediaStream | null = null;
      
      try {
        // First try: back camera with high resolution
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        console.log('✅ Back camera accessed');
      } catch (backCameraError) {
        console.log('⚠️ Back camera failed, trying front camera...');
        try {
          // Second try: front camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
          console.log('✅ Front camera accessed');
        } catch (frontCameraError) {
          console.log('⚠️ Front camera failed, trying any camera...');
          // Third try: any available camera
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
          console.log('✅ Any camera accessed');
        }
      }

      if (!stream) {
        throw new Error('Failed to get camera stream from all attempts');
      }

      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      console.log('🎬 Setting up video stream...');
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      
      // Wait for video to be ready
      videoRef.current.onloadedmetadata = async () => {
        console.log('📹 Video metadata loaded, starting video...');
        if (videoRef.current) {
          try {
            await videoRef.current.play();
            console.log('▶️ Video playing');
            setIsScanning(true);
            
            // Start 5-second countdown
            setCountdown(5);
            let timeLeft = 5;
            
            countdownIntervalRef.current = setInterval(() => {
              timeLeft--;
              setCountdown(timeLeft);
              console.log(`⏱️ Countdown: ${timeLeft} seconds`);
              
              if (timeLeft <= 0 && countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
            }, 1000);
            
            // Auto-activate after 5 seconds
            autoActivateTimeoutRef.current = setTimeout(() => {
              console.log('✅ 5 seconds elapsed - Auto-activating Deaf Mode');
              const mockID = generateMalaysianIC();
              console.log('🆔 Generated ID:', mockID);
              setScannedID(mockID);
              onIDScanned(mockID);
              stopScanning();
            }, 5000);
            
          } catch (playError) {
            console.error('❌ Play error:', playError);
            setError('Failed to play video. Please try again.');
            setIsCameraActive(false);
            setIsScanning(false);
          }
        }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      console.error('❌ Camera error:', err);
      setError(`Camera Error: ${errorMessage}. Please allow camera access and try again.`);
      setIsCameraActive(false); // Hide video element on error
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (autoActivateTimeoutRef.current) {
      clearTimeout(autoActivateTimeoutRef.current);
      autoActivateTimeoutRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setIsCameraActive(false);
    setCountdown(5);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-cyan-600" />
          Activate Deaf Mode
        </CardTitle>
        <CardDescription>
          Scan your Smart ID card to automatically activate accessibility features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '320px' }}>
          {!isCameraActive ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center p-4">
                <Fingerprint className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-sm text-gray-400 mb-4">
                  {disabled ? 'Camera disabled' : 'Ready to scan ID card'}
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={startScanning}
                    disabled={disabled}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Scan Smart ID Card
                  </button>
                  <button
                    onClick={() => {
                      // Manual trigger for demo
                      const mockID = generateMalaysianIC();
                      console.log('🧪 Manual trigger - ID:', mockID);
                      setScannedID(mockID);
                      onIDScanned(mockID);
                    }}
                    disabled={disabled}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Quick Demo (Skip Camera)
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Position your Smart ID card in front of the camera
                </p>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning overlay - like real ID scanner */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-cyan-500 rounded-lg w-64 h-40 animate-pulse">
                  <div className="absolute top-2 left-2 right-2 bottom-2 border-2 border-white rounded"></div>
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-white text-sm bg-black/70 px-4 py-2 rounded-lg">
                  Position Smart ID card within the frame
                </p>
              </div>

              {/* Stop button */}
              <button
                onClick={stopScanning}
                className="absolute top-4 right-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
              >
                Cancel
              </button>
            </>
          )}

          {/* Success indicator */}
          {scannedID && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
              <div className="text-center p-4 bg-white rounded-lg shadow-lg">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">ID Scanned!</p>
                <p className="text-xs text-gray-500 mt-1">ID: {scannedID}</p>
              </div>
            </div>
          )}

          {/* Error display - only show if camera is not active */}
          {error && !isCameraActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
              <div className="text-center p-4 bg-white rounded-lg shadow-lg max-w-md">
                <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-2" />
                <p className="text-sm font-medium text-gray-900">Error</p>
                <p className="text-xs text-gray-500 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {scannedID && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <p className="font-medium">✓ ID Card detected: {scannedID}</p>
            <p className="text-xs mt-1">Fetching profile information...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

