"""Pydantic v2 schemas for the AI tutor endpoints."""

from __future__ import annotations
from typing import Literal
from pydantic import BaseModel


class TutorRequest(BaseModel):
    """Payload sent to the tutor / chat endpoint."""

    message: str
    context_type: Literal["concept", "circuit", "results", "chat"] = "chat"
    circuit_config: dict | None = None
    simulation_results: dict | None = None
    level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    conversation_history: list[dict] = []


class TutorResponse(BaseModel):
    """Response from the AI tutor."""

    explanation: str
    is_ai_generated: bool
    suggestions: list[str] = []
    level: str
