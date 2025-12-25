"""
Personalized Greeting Generator for SmartSign Avatar Chatbot
Uses GPT-4o-mini to generate context-aware BIM greetings based on visit history
"""

import logging
import json
from typing import List, Optional
from datetime import datetime
from openai import OpenAI

from models.visit_history import (
    VisitHistory,
    PredictionResult,
    PersonalizedGreeting,
)

logger = logging.getLogger(__name__)


class GreetingGenerator:
    """
    Generates personalized BIM greetings for the avatar chatbot
    based on user's visit history and predicted intent.
    """

    # Greeting types for categorization
    GREETING_TYPES = {
        "document_submission": "Welcome back! Here to submit your documents?",
        "follow_up": "Hello! Here for your follow-up appointment?",
        "new_application": "Welcome! How can we help you today?",
        "renewal": "Hello! Time for your renewal?",
        "status_check": "Welcome back! Checking on your application status?",
        "generic": "Selamat datang! How may I assist you?",
    }

    # Quick actions based on greeting type
    QUICK_ACTIONS = {
        "document_submission": [
            "Submit documents",
            "View required documents",
            "Contact officer",
        ],
        "follow_up": [
            "Check appointment",
            "View case status",
            "Request assistance",
        ],
        "new_application": [
            "Start new application",
            "Check requirements",
            "Find department",
        ],
        "renewal": [
            "Start renewal",
            "Check eligibility",
            "View documents needed",
        ],
        "status_check": [
            "Check status",
            "View history",
            "Contact department",
        ],
        "generic": [
            "View services",
            "Check queue",
            "Get help",
        ],
    }

    def __init__(self, openai_client: Optional[OpenAI] = None):
        self.client = openai_client

    def _determine_greeting_type(
        self,
        visits: List[VisitHistory],
        prediction: Optional[PredictionResult] = None
    ) -> str:
        """Determine the appropriate greeting type based on context"""

        if prediction:
            intent_lower = prediction.predicted_intent.lower()

            if any(word in intent_lower for word in ["submit", "document", "bring"]):
                return "document_submission"
            elif any(word in intent_lower for word in ["follow", "continue", "return"]):
                return "follow_up"
            elif any(word in intent_lower for word in ["renew", "renewal"]):
                return "renewal"
            elif any(word in intent_lower for word in ["status", "check", "progress"]):
                return "status_check"
            elif any(word in intent_lower for word in ["new", "apply", "start"]):
                return "new_application"

        # Fallback to visit history analysis
        if visits:
            last_visit = visits[0]

            if last_visit.follow_up_required:
                return "document_submission"
            elif last_visit.status == "In Progress":
                return "status_check"
            elif last_visit.documents_requested:
                return "document_submission"

        return "generic"

    def _format_context_for_greeting(
        self,
        visits: List[VisitHistory],
        prediction: Optional[PredictionResult] = None
    ) -> str:
        """Format context for LLM greeting generation"""
        parts = []

        if prediction:
            parts.append(f"Predicted purpose: {prediction.predicted_intent}")
            parts.append(f"Confidence: {int(prediction.confidence * 100)}%")

        if visits:
            last = visits[0]
            parts.append(f"Last visit: {last.location} on {last.datetime[:10]}")
            parts.append(f"Previous purpose: {last.application}")

            if last.follow_up_required:
                parts.append(f"Has pending follow-up by {last.follow_up_date}")

            if last.documents_requested:
                remaining = [d for d in last.documents_requested
                           if d not in (last.documents_submitted or [])]
                if remaining:
                    parts.append(f"Documents still needed: {', '.join(remaining)}")

        return "\n".join(parts) if parts else "No previous context available"

    async def generate_greeting(
        self,
        user_id: str,
        visits: List[VisitHistory],
        prediction: Optional[PredictionResult] = None,
        current_location: Optional[str] = None,
    ) -> PersonalizedGreeting:
        """
        Generate a personalized greeting for the avatar chatbot

        Args:
            user_id: Citizen's IC number (not used in greeting)
            visits: List of visit history records
            prediction: Optional prediction result
            current_location: Current service center

        Returns:
            PersonalizedGreeting with greeting text and quick actions
        """
        greeting_type = self._determine_greeting_type(visits, prediction)
        context = self._format_context_for_greeting(visits, prediction)

        # If no OpenAI client or no context, use template
        if not self.client or (not visits and not prediction):
            return PersonalizedGreeting(
                greeting_text=self.GREETING_TYPES.get(greeting_type, self.GREETING_TYPES["generic"]),
                greeting_type=greeting_type,
                is_personalized=False,
                prediction_summary=None,
                quick_actions=self.QUICK_ACTIONS.get(greeting_type, self.QUICK_ACTIONS["generic"]),
            )

        try:
            prompt = f"""Generate a warm, personalized greeting for a Deaf citizen visiting a Malaysian government service center.

Context:
{context}

Current Location: {current_location or 'Government Service Center'}
Greeting Type: {greeting_type}

Generate a short, friendly greeting (max 15 words) that:
1. Acknowledges why they might be here today
2. Is warm and welcoming
3. Is appropriate for sign language interpretation (simple, clear words)
4. Does NOT include any personal information (names, IC numbers)

Examples:
- "Hello! Are you here to submit the documents requested last Tuesday?"
- "Welcome back! Here to check on your passport renewal?"
- "Selamat datang! Ready to complete your application today?"

Respond in JSON format:
{{
    "greeting": "Your personalized greeting here",
    "prediction_summary": "Brief context (5-10 words) or null if no specific context"
}}

Only respond with valid JSON, nothing else."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=100,
                response_format={"type": "json_object"},
                messages=[{"role": "user", "content": prompt}]
            )

            result = json.loads(response.choices[0].message.content)

            return PersonalizedGreeting(
                greeting_text=result.get("greeting", self.GREETING_TYPES[greeting_type]),
                greeting_type=greeting_type,
                is_personalized=True,
                prediction_summary=result.get("prediction_summary"),
                quick_actions=self.QUICK_ACTIONS.get(greeting_type, self.QUICK_ACTIONS["generic"]),
            )

        except Exception as e:
            logger.error(f"Greeting generation failed: {str(e)}")

            # Fallback to template with context
            fallback_greeting = self.GREETING_TYPES.get(greeting_type, self.GREETING_TYPES["generic"])

            return PersonalizedGreeting(
                greeting_text=fallback_greeting,
                greeting_type=greeting_type,
                is_personalized=False,
                prediction_summary=prediction.predicted_intent if prediction else None,
                quick_actions=self.QUICK_ACTIONS.get(greeting_type, self.QUICK_ACTIONS["generic"]),
            )
