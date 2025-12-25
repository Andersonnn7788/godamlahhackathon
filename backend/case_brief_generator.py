"""
Intelligent Case Brief Generator for SmartSign
Uses GPT-4o-mini with RAG approach to generate context-aware narrative summaries for officers
"""

import logging
import json
import re
from typing import List, Optional, Dict, Any
from datetime import datetime
from openai import OpenAI

from models.visit_history import (
    VisitHistory,
    DepartmentalLog,
    CaseBrief,
)

logger = logging.getLogger(__name__)


class CaseBriefGenerator:
    """
    Generates intelligent case briefs using RAG (Retrieval-Augmented Generation) approach.
    Pulls context from visit history and inter-departmental logs to create narrative summaries.
    """

    def __init__(self, openai_client: Optional[OpenAI] = None):
        self.client = openai_client

    def _build_rag_context(
        self,
        visits: List[VisitHistory],
        logs: List[DepartmentalLog]
    ) -> str:
        """Build RAG context from multiple data sources"""
        context_parts = []

        # Recent visit history context
        if visits:
            context_parts.append("## Recent Visit History")
            for visit in visits[:5]:  # Limit to 5 most recent
                context_parts.append(f"""
- {visit.datetime}: Visited {visit.location}
  Purpose: {visit.application}
  Status: {visit.status}
  Documents Requested: {', '.join(visit.documents_requested) if visit.documents_requested else 'None'}
  Documents Submitted: {', '.join(visit.documents_submitted) if visit.documents_submitted else 'None'}
  Follow-up: {'Required by ' + visit.follow_up_date if visit.follow_up_required else 'None'}
  Officer Notes: {visit.officer_notes or 'N/A'}
""")

        # Inter-departmental logs context
        if logs:
            context_parts.append("\n## Inter-Departmental Activity")
            for log in logs[:5]:
                context_parts.append(f"""
- {log.date}: {log.department}
  Action: {log.action_type}
  Summary: {log.summary}
  Related Documents: {', '.join(log.related_documents) if log.related_documents else 'N/A'}
""")

        return "\n".join(context_parts)

    def _anonymize_brief(self, brief: str, user_name: Optional[str] = None) -> str:
        """Remove all PII from generated brief - privacy first approach"""
        # Replace any potential IC numbers
        brief = re.sub(r'\d{6}-\d{2}-\d{4}', '[ID]', brief)

        # Replace phone numbers
        brief = re.sub(r'\+?\d{10,12}', '[PHONE]', brief)
        brief = re.sub(r'\d{3}[-.\s]?\d{3,4}[-.\s]?\d{4}', '[PHONE]', brief)

        # Replace email addresses
        brief = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL]', brief)

        # Replace specific user name if provided
        if user_name:
            brief = re.sub(re.escape(user_name), 'this citizen', brief, flags=re.IGNORECASE)

        return brief

    async def generate_brief(
        self,
        user_id: str,
        visits: List[VisitHistory],
        logs: List[DepartmentalLog],
        current_location: Optional[str] = None,
        user_name: Optional[str] = None,
    ) -> CaseBrief:
        """
        Generate an intelligent case brief for officers

        Args:
            user_id: Citizen's IC number (not included in output)
            visits: List of visit history records
            logs: List of inter-departmental log entries
            current_location: Current service center
            user_name: User's name (for anonymization)

        Returns:
            CaseBrief with narrative summary and actionable insights
        """
        context = self._build_rag_context(visits, logs)

        # Determine context sources used
        sources = []
        if visits:
            sources.append(f"Visit history ({len(visits)} records)")
        if logs:
            sources.append(f"Departmental logs ({len(logs)} entries)")

        # If no OpenAI client, use rule-based fallback
        if not self.client:
            return self._fallback_brief(visits, logs, sources)

        try:
            prompt = f"""You are a government service assistant helping officers understand a citizen's case context.

Current Location: {current_location or 'Unknown'}
Today's Date: {datetime.now().strftime('%Y-%m-%d')}

{context}

Based on this information, generate a helpful brief for the officer.

Guidelines:
1. Write a natural narrative summary (2-3 sentences) explaining why this citizen might be here today
2. List 2-3 key points the officer should know
3. Identify any pending items (documents to submit, follow-ups due)
4. Suggest 1-2 recommended actions for the officer
5. IMPORTANT: Do NOT include any personally identifiable information (names, IC numbers, addresses, phone numbers)
6. Use "this citizen" or "the visitor" instead of names
7. Be concise, helpful, and respectful

Respond in JSON format:
{{
    "narrative": "Natural language summary (2-3 sentences)",
    "key_points": ["point1", "point2", "point3"],
    "pending_items": ["item1", "item2"],
    "recommended_actions": ["action1", "action2"]
}}

Only respond with valid JSON, nothing else."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=500,
                response_format={"type": "json_object"},
                messages=[{"role": "user", "content": prompt}]
            )

            result = json.loads(response.choices[0].message.content)

            # Anonymize the narrative
            narrative = self._anonymize_brief(
                result.get("narrative", "No recent activity recorded."),
                user_name
            )

            return CaseBrief(
                narrative=narrative,
                key_points=result.get("key_points", [])[:5],
                pending_items=result.get("pending_items", [])[:5],
                recommended_actions=result.get("recommended_actions", [])[:3],
                context_sources=sources,
                generated_at=datetime.now().isoformat(),
                privacy_verified=True
            )

        except Exception as e:
            logger.error(f"Case brief generation failed: {str(e)}")
            return self._fallback_brief(visits, logs, sources)

    def _fallback_brief(
        self,
        visits: List[VisitHistory],
        logs: List[DepartmentalLog],
        sources: List[str]
    ) -> CaseBrief:
        """Rule-based fallback when GPT is unavailable"""

        narrative_parts = []
        key_points = []
        pending_items = []
        recommended_actions = []

        if visits:
            last_visit = visits[0]

            # Build narrative
            days_ago = self._days_since(last_visit.datetime)
            if days_ago == 0:
                time_str = "earlier today"
            elif days_ago == 1:
                time_str = "yesterday"
            elif days_ago < 7:
                time_str = f"{days_ago} days ago"
            else:
                time_str = f"on {last_visit.datetime[:10]}"

            narrative_parts.append(
                f"This citizen visited {last_visit.location} {time_str} regarding {last_visit.application}."
            )

            # Check for pending items
            if last_visit.follow_up_required:
                narrative_parts.append(
                    f"They were asked to return with additional documentation."
                )
                pending_items.append(f"Follow-up from {last_visit.location}")

            if last_visit.documents_requested:
                for doc in last_visit.documents_requested:
                    if doc not in (last_visit.documents_submitted or []):
                        pending_items.append(f"Submit: {doc}")

            # Key points
            key_points.append(f"Last visit: {last_visit.location} - {last_visit.application}")
            key_points.append(f"Status: {last_visit.status}")
            if last_visit.officer_notes:
                key_points.append(f"Previous notes: {last_visit.officer_notes}")

        else:
            narrative_parts.append("This appears to be a new visitor with no previous records in the system.")
            key_points.append("First-time visitor")

        # Check departmental logs
        if logs:
            recent_log = logs[0]
            if recent_log.action_type == "document_request":
                pending_items.append(f"Requested: {', '.join(recent_log.related_documents)}")
            key_points.append(f"Recent activity: {recent_log.summary}")

        # Recommended actions
        if pending_items:
            recommended_actions.append("Verify if citizen has brought the requested documents")
        recommended_actions.append("Use BIM sign language interpreter for communication")
        if visits and visits[0].status == "In Progress":
            recommended_actions.append("Continue processing the existing application")

        return CaseBrief(
            narrative=" ".join(narrative_parts),
            key_points=key_points[:5],
            pending_items=pending_items[:5],
            recommended_actions=recommended_actions[:3],
            context_sources=sources,
            generated_at=datetime.now().isoformat(),
            privacy_verified=True
        )

    def _days_since(self, datetime_str: str) -> int:
        """Calculate days since a given datetime string"""
        try:
            visit_date = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
            if visit_date.tzinfo:
                visit_date = visit_date.replace(tzinfo=None)
            return (datetime.now() - visit_date).days
        except:
            return 7  # Default to a week ago if parsing fails
