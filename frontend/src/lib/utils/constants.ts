import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  wsURL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  timeout: 10000,  // Reduced to 10 seconds to prevent timeout errors
  maxRetries: 3,
};

export const VIDEO_CONFIG = {
  width: 1280,
  height: 720,
  frameRate: 30,
  facingMode: 'user',
};

export const AVATAR_CONFIG = {
  animationSpeed: 1,
  transitionDuration: 300,
  idleAnimation: true,
};
