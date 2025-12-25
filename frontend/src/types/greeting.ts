/**
 * TypeScript types for Personalized BIM Greeting (Avatar Chatbot)
 */

export interface PersonalizedGreeting {
  greeting_text: string;
  greeting_type: 'document_submission' | 'follow_up' | 'new_application' | 'renewal' | 'status_check' | 'generic';
  is_personalized: boolean;
  prediction_summary: string | null;
  quick_actions: string[];
}

export interface GenerateGreetingRequest {
  user_id: string;
  current_location?: string;
  include_prediction?: boolean;
}

export interface GenerateGreetingResponse {
  success: boolean;
  greeting: PersonalizedGreeting;
  prediction: import('./prediction').PredictionResult | null;
}

export interface VisitHistoryItem {
  id: string;
  user_id: string;
  location: string;
  department: string;
  datetime: string;
  application: string;
  queue?: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  documents_requested: string[];
  documents_submitted: string[];
  handling_time_minutes?: number;
  officer_notes?: string;
  phrases_detected: string[];
  follow_up_required: boolean;
  follow_up_date?: string;
  preferred_language: string;
}

export interface VisitHistoryResponse {
  success: boolean;
  user_id: string;
  visits: VisitHistoryItem[];
  total: number;
}
