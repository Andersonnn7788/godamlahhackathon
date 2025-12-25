"""
Predictive Intent Engine for SmartSign
Uses GPT-4o-mini to analyze visit patterns and predict citizen's visit purpose
"""

import logging
import json
from typing import List, Optional, Dict, Any
from datetime import datetime
from openai import OpenAI

from models.visit_history import (
    VisitHistory,
    PredictionResult,
    AlternativeIntent,
)

logger = logging.getLogger(__name__)


class IntentPredictionEngine:
    """
    AI-powered intent prediction engine that analyzes visit history patterns
    to predict why a citizen is visiting a government service center.
    """

    def __init__(self, openai_client: Optional[OpenAI] = None):
        self.client = openai_client

    def _format_visit_history(self, visits: List[VisitHistory]) -> str:
        """Format visit history for LLM context"""
        if not visits:
            return "No previous visits recorded."

        formatted = []
        for i, visit in enumerate(visits[:10], 1):  # Limit to 10 most recent
            formatted.append(f"""
Visit {i}:
- Date: {visit.datetime}
- Location: {visit.location} ({visit.department})
- Purpose: {visit.application}
- Status: {visit.status}
- Documents Requested: {', '.join(visit.documents_requested) if visit.documents_requested else 'None'}
- Documents Submitted: {', '.join(visit.documents_submitted) if visit.documents_submitted else 'None'}
- Follow-up Required: {'Yes, by ' + visit.follow_up_date if visit.follow_up_required and visit.follow_up_date else 'No'}
- Signs Used: {', '.join(visit.phrases_detected) if visit.phrases_detected else 'N/A'}
""")
        return "\n".join(formatted)

    def _analyze_patterns(self, visits: List[VisitHistory]) -> Dict[str, Any]:
        """Analyze visit patterns for context"""
        if not visits:
            return {
                "total_visits": 0,
                "frequent_departments": [],
                "pending_follow_ups": [],
                "recent_documents_requested": [],
            }

        # Count department frequency
        dept_counts = {}
        for visit in visits:
            dept_counts[visit.location] = dept_counts.get(visit.location, 0) + 1
        frequent_depts = sorted(dept_counts.items(), key=lambda x: x[1], reverse=True)[:3]

        # Find pending follow-ups
        pending = [v for v in visits if v.follow_up_required and v.status != "Completed"]

        # Recent document requests
        recent_docs = []
        for visit in visits[:3]:
            if visit.documents_requested:
                recent_docs.extend([
                    {"doc": doc, "from": visit.location, "date": visit.datetime}
                    for doc in visit.documents_requested
                ])

        return {
            "total_visits": len(visits),
            "frequent_departments": [{"dept": d[0], "count": d[1]} for d in frequent_depts],
            "pending_follow_ups": [
                {"location": v.location, "application": v.application, "follow_up_date": v.follow_up_date}
                for v in pending[:3]
            ],
            "recent_documents_requested": recent_docs[:5],
        }

    async def predict_intent(
        self,
        user_id: str,
        visits: List[VisitHistory],
        current_location: Optional[str] = None,
    ) -> PredictionResult:
        """
        Predict the citizen's visit intent based on historical patterns

        Args:
            user_id: Citizen's IC number (anonymized in output)
            visits: List of previous visit records
            current_location: Current service center location (if known)

        Returns:
            PredictionResult with predicted intent and confidence
        """
        # Analyze patterns first
        patterns = self._analyze_patterns(visits)
        history_text = self._format_visit_history(visits)

        # If no OpenAI client, use rule-based fallback
        if not self.client:
            return self._fallback_prediction(visits, patterns, current_location)

        try:
            prompt = f"""You are an AI assistant analyzing visit patterns for a Deaf citizen at a Malaysian government service center.

Current Location: {current_location or 'Unknown'}
Today's Date: {datetime.now().strftime('%Y-%m-%d')}

Visit History:
{history_text}

Pattern Analysis:
- Total previous visits: {patterns['total_visits']}
- Frequently visited: {', '.join([d['dept'] for d in patterns['frequent_departments']]) or 'None'}
- Pending follow-ups: {len(patterns['pending_follow_ups'])}
- Recent document requests: {len(patterns['recent_documents_requested'])}

Based on this information, predict why this citizen is visiting today. Consider:
1. Pending follow-ups or document submissions
2. Renewal cycles (passports, licenses typically renew every 5-10 years)
3. Continuation of previous applications
4. New applications based on visit patterns

Respond in JSON format:
{{
    "predicted_intent": "Brief description of likely purpose (10-15 words max)",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation based on patterns (20-30 words)",
    "alternative_intents": [
        {{"intent": "Alternative purpose", "confidence": 0.0-1.0}}
    ]
}}

Only respond with valid JSON, nothing else."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=300,
                response_format={"type": "json_object"},
                messages=[{"role": "user", "content": prompt}]
            )

            result = json.loads(response.choices[0].message.content)

            confidence = min(max(float(result.get("confidence", 0.5)), 0.0), 1.0)

            return PredictionResult(
                predicted_intent=result.get("predicted_intent", "General inquiry"),
                confidence=confidence,
                reasoning=result.get("reasoning", "Based on visit history analysis"),
                display_text=f"Likely purpose: {result.get('predicted_intent', 'General inquiry')} ({int(confidence * 100)}% confidence)",
                alternative_intents=[
                    AlternativeIntent(
                        intent=alt.get("intent", ""),
                        confidence=min(max(float(alt.get("confidence", 0.3)), 0.0), 1.0)
                    )
                    for alt in result.get("alternative_intents", [])[:3]
                ],
                supporting_visits=[v.id for v in visits[:3]] if visits else []
            )

        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            return self._fallback_prediction(visits, patterns, current_location)

    def _fallback_prediction(
        self,
        visits: List[VisitHistory],
        patterns: Dict[str, Any],
        current_location: Optional[str] = None
    ) -> PredictionResult:
        """Rule-based fallback when GPT is unavailable"""

        # Check for pending follow-ups first
        if patterns["pending_follow_ups"]:
            follow_up = patterns["pending_follow_ups"][0]
            intent = f"Submit documents for {follow_up['application']}"
            confidence = 0.85
            reasoning = f"Pending follow-up from previous visit to {follow_up['location']}"

        # Check for recent document requests
        elif patterns["recent_documents_requested"]:
            doc = patterns["recent_documents_requested"][0]
            intent = f"Submit {doc['doc']} as requested"
            confidence = 0.75
            reasoning = f"Document was requested during recent visit to {doc['from']}"

        # Check frequent departments
        elif patterns["frequent_departments"] and current_location:
            for dept in patterns["frequent_departments"]:
                if dept["dept"].lower() in current_location.lower():
                    intent = f"Continuation of services at {dept['dept']}"
                    confidence = 0.65
                    reasoning = f"Citizen has visited {dept['dept']} {dept['count']} times previously"
                    break
            else:
                intent = "General inquiry or new application"
                confidence = 0.45
                reasoning = "No clear pattern matching current location"
        else:
            intent = "New application or general inquiry"
            confidence = 0.40
            reasoning = "Limited visit history available for prediction"

        return PredictionResult(
            predicted_intent=intent,
            confidence=confidence,
            reasoning=reasoning,
            display_text=f"Likely purpose: {intent} ({int(confidence * 100)}% confidence)",
            alternative_intents=[
                AlternativeIntent(intent="General inquiry", confidence=0.30),
                AlternativeIntent(intent="Document collection", confidence=0.25),
            ],
            supporting_visits=[v.id for v in visits[:3]] if visits else []
        )
