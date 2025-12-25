"""
Pydantic models for SmartSign AI Features:
- Visit History tracking
- Predictive Intent Engine
- Intelligent Case Brief
- Personalized Greeting
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class VisitStatus(str, Enum):
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    PENDING = "Pending"


class VisitHistory(BaseModel):
    """Record of a citizen's visit to a government department"""
    id: str
    user_id: str  # IC number
    location: str  # e.g., "Immigration", "JPJ", "JPN"
    department: str  # Full department name
    datetime: str  # ISO format datetime
    application: str  # e.g., "Passport Renewal", "Driving License"
    queue: Optional[str] = None  # Queue number
    status: VisitStatus
    documents_requested: List[str] = Field(default_factory=list)
    documents_submitted: List[str] = Field(default_factory=list)
    handling_time_minutes: Optional[int] = None
    officer_notes: Optional[str] = None  # Anonymized notes
    phrases_detected: List[str] = Field(default_factory=list)  # BIM signs used
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    preferred_language: str = "BIM"


class AlternativeIntent(BaseModel):
    """Alternative predicted intent with lower confidence"""
    intent: str
    confidence: float


class PredictionResult(BaseModel):
    """Result from the Predictive Intent Engine"""
    predicted_intent: str
    confidence: float  # 0.0 to 1.0
    reasoning: str
    display_text: str  # e.g., "Likely purpose: Renewal of OKU benefits (92% confidence)"
    alternative_intents: List[AlternativeIntent] = Field(default_factory=list)
    supporting_visits: List[str] = Field(default_factory=list)  # Visit IDs


class DepartmentalLog(BaseModel):
    """Inter-departmental log entry for RAG context"""
    department: str
    date: str
    action_type: str  # e.g., "document_request", "application_status", "referral"
    summary: str
    related_documents: List[str] = Field(default_factory=list)
    officer_department: str


class CaseBrief(BaseModel):
    """Generated case brief for officers (Smart Brief)"""
    narrative: str  # Natural language summary
    key_points: List[str] = Field(default_factory=list)
    pending_items: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    context_sources: List[str] = Field(default_factory=list)
    generated_at: str
    privacy_verified: bool = True


class PersonalizedGreeting(BaseModel):
    """Personalized BIM greeting for avatar chatbot"""
    greeting_text: str  # Natural language greeting
    greeting_type: str  # Category: "document_submission", "follow_up", "new_application", "generic"
    is_personalized: bool
    prediction_summary: Optional[str] = None  # Brief prediction context
    quick_actions: List[str] = Field(default_factory=list)  # Suggested actions


# Request/Response models for API endpoints

class PredictIntentRequest(BaseModel):
    """Request body for /predict-intent endpoint"""
    user_id: str
    current_location: Optional[str] = None


class GenerateCaseBriefRequest(BaseModel):
    """Request body for /generate-case-brief endpoint"""
    user_id: str
    current_location: Optional[str] = None


class GenerateGreetingRequest(BaseModel):
    """Request body for /generate-greeting endpoint"""
    user_id: str
    current_location: Optional[str] = None
    include_prediction: bool = True
