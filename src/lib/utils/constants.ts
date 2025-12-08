import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  wsURL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  timeout: 30000,
  maxRetries: 3,
};

export const VIDEO_CONFIG = {
  width: 640,
  height: 480,
  frameRate: 30,
  facingMode: 'user',
};

export const AVATAR_CONFIG = {
  animationSpeed: 1,
  transitionDuration: 300,
  idleAnimation: true,
};
