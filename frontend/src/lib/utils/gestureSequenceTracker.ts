/**
 * Gesture Sequence Tracker
 * Tracks hand movements over time to recognize dynamic sign language gestures
 */

export interface DetectionFrame {
  timestamp: number;
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  modelName?: string;
}

export interface GestureSequence {
  frames: DetectionFrame[];
  startTime: number;
  endTime: number;
  dominantLabel: string;
  averageConfidence: number;
  movementPattern: 'static' | 'moving' | 'complex';
}

export class GestureSequenceTracker {
  private frameBuffer: DetectionFrame[] = [];
  private readonly maxBufferSize = 10; // Keep last 10 frames (3 seconds at 0.33 FPS)
  private readonly sequenceTimeout = 5000; // 5 seconds to complete a gesture
  private readonly movementThreshold = 50; // pixels
  private readonly stabilityThreshold = 3; // frames with same label = stable gesture

  /**
   * Add a new detection frame to the buffer
   */
  addFrame(frame: DetectionFrame): void {
    this.frameBuffer.push(frame);

    // Remove old frames
    if (this.frameBuffer.length > this.maxBufferSize) {
      this.frameBuffer.shift();
    }

    // Clean up frames older than sequence timeout
    const now = Date.now();
    this.frameBuffer = this.frameBuffer.filter(
      (f) => now - f.timestamp < this.sequenceTimeout
    );
  }

  /**
   * Get the current gesture sequence
   */
  getCurrentSequence(): GestureSequence | null {
    if (this.frameBuffer.length === 0) {
      return null;
    }

    const startTime = this.frameBuffer[0].timestamp;
    const endTime = this.frameBuffer[this.frameBuffer.length - 1].timestamp;

    // Find dominant label (most frequent)
    const labelCounts = new Map<string, number>();
    this.frameBuffer.forEach((frame) => {
      labelCounts.set(frame.label, (labelCounts.get(frame.label) || 0) + 1);
    });

    let dominantLabel = '';
    let maxCount = 0;
    labelCounts.forEach((count, label) => {
      if (count > maxCount) {
        maxCount = count;
        dominantLabel = label;
      }
    });

    // Calculate average confidence
    const averageConfidence =
      this.frameBuffer.reduce((sum, frame) => sum + frame.confidence, 0) /
      this.frameBuffer.length;

    // Detect movement pattern
    const movementPattern = this.detectMovementPattern();

    return {
      frames: [...this.frameBuffer],
      startTime,
      endTime,
      dominantLabel,
      averageConfidence,
      movementPattern,
    };
  }

  /**
   * Check if the current gesture is stable (same label for multiple frames)
   */
  isStableGesture(): boolean {
    if (this.frameBuffer.length < this.stabilityThreshold) {
      return false;
    }

    // Check last N frames for same label
    const recentFrames = this.frameBuffer.slice(-this.stabilityThreshold);
    const firstLabel = recentFrames[0].label;

    return recentFrames.every((frame) => frame.label === firstLabel);
  }

  /**
   * Detect if hand is moving or static
   */
  private detectMovementPattern(): 'static' | 'moving' | 'complex' {
    if (this.frameBuffer.length < 2) {
      return 'static';
    }

    let totalMovement = 0;
    let directionChanges = 0;
    let previousDirection: 'left' | 'right' | 'up' | 'down' | null = null;

    for (let i = 1; i < this.frameBuffer.length; i++) {
      const prev = this.frameBuffer[i - 1];
      const curr = this.frameBuffer[i];

      // Calculate movement distance
      const dx = curr.bbox.x - prev.bbox.x;
      const dy = curr.bbox.y - prev.bbox.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      totalMovement += distance;

      // Track direction changes
      const currentDirection = this.getDirection(dx, dy);
      if (previousDirection && currentDirection !== previousDirection) {
        directionChanges++;
      }
      previousDirection = currentDirection;
    }

    const averageMovement = totalMovement / (this.frameBuffer.length - 1);

    // Classify movement pattern
    if (averageMovement < this.movementThreshold / 2) {
      return 'static';
    } else if (directionChanges >= 2) {
      return 'complex'; // Multiple direction changes = complex gesture
    } else {
      return 'moving'; // Simple directional movement
    }
  }

  /**
   * Get movement direction
   */
  private getDirection(dx: number, dy: number): 'left' | 'right' | 'up' | 'down' {
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }

  /**
   * Get gesture confidence based on stability and consistency
   */
  getGestureConfidence(): number {
    const sequence = this.getCurrentSequence();
    if (!sequence) return 0;

    let confidence = sequence.averageConfidence;

    // Boost confidence for stable gestures
    if (this.isStableGesture()) {
      confidence *= 1.2;
    }

    // Reduce confidence for very short sequences
    if (sequence.frames.length < 3) {
      confidence *= 0.8;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Clear the frame buffer
   */
  clear(): void {
    this.frameBuffer = [];
  }

  /**
   * Get the number of frames in the buffer
   */
  getFrameCount(): number {
    return this.frameBuffer.length;
  }

  /**
   * Check if we have enough frames to make a prediction
   */
  hasEnoughFrames(): boolean {
    return this.frameBuffer.length >= 3;
  }

  /**
   * Get movement description for UI
   */
  getMovementDescription(): string {
    const pattern = this.detectMovementPattern();
    const sequence = this.getCurrentSequence();

    if (!sequence) return 'No gesture detected';

    switch (pattern) {
      case 'static':
        return `Static sign: ${sequence.dominantLabel}`;
      case 'moving':
        return `Moving sign: ${sequence.dominantLabel}`;
      case 'complex':
        return `Complex gesture: ${sequence.dominantLabel}`;
      default:
        return 'Detecting...';
    }
  }
}

