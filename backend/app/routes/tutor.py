"""REST endpoints for Q-ASSIST — AI Quantum Tutor."""

from fastapi import APIRouter
from ..schemas.tutor import TutorRequest, TutorResponse
from ..services.ai_service import AITutorService

router = APIRouter(prefix="/api", tags=["AI Tutor"])
tutor_service = AITutorService()


@router.post("/tutor/explain", response_model=TutorResponse)
async def explain(request: TutorRequest):
    """Generate an AI-powered (or verified educational fallback) explanation."""
    result = await tutor_service.generate_explanation(
        message=request.message,
        context_type=request.context_type,
        circuit_config=request.circuit_config,
        simulation_results=request.simulation_results,
        level=request.level,
        conversation_history=request.conversation_history,
    )
    return TutorResponse(
        explanation=result["explanation"],
        is_ai_generated=result["is_ai_generated"],
        suggestions=result.get("suggestions", []),
        level=request.level,
    )


@router.post("/tutor/chat", response_model=TutorResponse)
async def chat(request: TutorRequest):
    """Conversational follow-up endpoint for Q-ASSIST."""
    result = await tutor_service.generate_explanation(
        message=request.message,
        context_type=request.context_type or "chat",
        circuit_config=request.circuit_config,
        simulation_results=request.simulation_results,
        level=request.level,
        conversation_history=request.conversation_history,
    )
    return TutorResponse(
        explanation=result["explanation"],
        is_ai_generated=result["is_ai_generated"],
        suggestions=result.get("suggestions", []),
        level=request.level,
    )
