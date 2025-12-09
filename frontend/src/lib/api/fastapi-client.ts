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

  // Detect gesture from frame
  async detectGesture(request: DetectGestureRequest): Promise<DetectGestureResponse> {
    const response = await this.client.post<DetectGestureResponse>(
      '/api/sign-language/detect',
      request
    );
    return response.data;
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
