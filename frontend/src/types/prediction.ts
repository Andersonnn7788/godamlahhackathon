/**
 * TypeScript types for Predictive Intent Engine
 */

export interface AlternativeIntent {
  intent: string;
  confidence: number;
}

export interface PredictionResult {
  predicted_intent: string;
  confidence: number;
  reasoning: string;
  display_text: string;
  alternative_intents: AlternativeIntent[];
  supporting_visits: string[];
}

export interface PredictIntentRequest {
  user_id: string;
  current_location?: string;
}

export interface PredictIntentResponse {
  success: boolean;
  prediction: PredictionResult;
}
