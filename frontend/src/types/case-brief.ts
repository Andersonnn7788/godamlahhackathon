/**
 * TypeScript types for Intelligent Case Brief (Smart Brief)
 */

export interface CaseBrief {
  narrative: string;
  key_points: string[];
  pending_items: string[];
  recommended_actions: string[];
  context_sources: string[];
  generated_at: string;
  privacy_verified: boolean;
}

export interface GenerateCaseBriefRequest {
  user_id: string;
  current_location?: string;
}

export interface GenerateCaseBriefResponse {
  success: boolean;
  brief: CaseBrief;
}
