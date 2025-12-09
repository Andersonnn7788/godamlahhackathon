import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  DetectGestureRequest,
  DetectGestureResponse,
  TranslateToSignRequest,
  TranslateToSignResponse,
  HealthCheckResponse,
} from '@/types/api';
import { API_CONFIG } from '@/lib/utils/constants';

class FastAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add timestamp to all requests
        config.headers['X-Request-Timestamp'] = Date.now().toString();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await this.client.get<HealthCheckResponse>('/health');
    return response.data;
  }

  // Detect gesture from frame using Roboflow multi-model backend
  async detectGesture(request: DetectGestureRequest): Promise<DetectGestureResponse> {
    try {
      console.log('🔄 Converting frame to blob...');
      // Convert base64 data URL to blob
      const base64Data = request.frame.imageData.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid image data: no base64 content');
      }
      
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      console.log(`✅ Blob created: ${blob.size} bytes`);

      // Create form data
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');

      console.log(`🌐 Calling backend: ${this.client.defaults.baseURL}/sign-to-text-multi`);
      // Call the backend FAST hybrid endpoint (MediaPipe + Single Model)
      const response = await this.client.post('/sign-to-text-fast', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000,  // 10 second timeout (much faster than multi-model)
      });

      console.log('📊 Backend raw response:', response.data);

      // Transform backend response to match expected format
      if (response.data.success) {
        return {
          success: true,
          data: {
            gesture: {
              name: response.data.label || 'unknown',
              confidence: response.data.confidence || 0,
              timestamp: Date.now(),
            },
            text: response.data.text || '',
            confidence: response.data.confidence || 0,
          },
        };
      } else {
        return {
          success: false,
          error: response.data.text || 'No sign detected',
        };
      }
    } catch (error) {
      console.error('❌ Gesture detection error:', error);
      if (error instanceof AxiosError) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Detection failed',
      };
    }
  }

  // Translate text to sign language
  async translateToSign(request: TranslateToSignRequest): Promise<TranslateToSignResponse> {
    const response = await this.client.post<TranslateToSignResponse>(
      '/api/sign-language/translate',
      request
    );
    return response.data;
  }

  // Get available gestures
  async getAvailableGestures(): Promise<string[]> {
    const response = await this.client.get<{ gestures: string[] }>(
      '/api/sign-language/gestures'
    );
    return response.data.gestures;
  }
}

// Export singleton instance
export const fastapiClient = new FastAPIClient();
