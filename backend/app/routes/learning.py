"""REST endpoints for the AI-Guided Quantum Learning Academy."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database.database import get_db
from ..schemas.learning import (
    Module,
    ModuleList,
    Lesson,
    QuizSubmission,
    QuizResultResponse,
    LearningProgressResponse,
)
from ..services import learning_service

router = APIRouter(prefix="/api", tags=["Learning Academy"])


@router.get("/learning", response_model=ModuleList)
def list_modules():
    return ModuleList(modules=learning_service.get_all_modules())


@router.get("/learning/progress")
def get_learning_progress(db: Session = Depends(get_db)):
    progress = learning_service.get_progress(db)
    achievements = learning_service.get_achievements(db)
    stats = learning_service.get_learning_stats(db)
    return {
        "progress": [
            LearningProgressResponse(
                module_id=p.module_id,
                lesson_id=p.lesson_id,
                completed=p.completed,
                score=p.score,
                completed_at=p.completed_at,
            )
            for p in progress
        ],
        "achievements": [
            {
                "id": a.id,
                "name": a.name,
                "description": a.description,
                "icon": a.icon,
                "earned_at": a.earned_at.isoformat() if a.earned_at else None,
            }
            for a in achievements
        ],
        "stats": stats,
    }


@router.get("/learning/{module_id}", response_model=Module)
def get_module(module_id: str):
    mod = learning_service.get_module_by_id(module_id)
    if not mod:
        raise HTTPException(status_code=404, detail="Learning module not found.")
    return mod


@router.get("/learning/{module_id}/lessons/{lesson_id}", response_model=Lesson)
def get_lesson(module_id: str, lesson_id: str):
    lesson = learning_service.get_lesson_by_id(module_id, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")
    return lesson


@router.post("/learning/{module_id}/lessons/{lesson_id}/visit")
def visit_lesson(module_id: str, lesson_id: str, db: Session = Depends(get_db)):
    lesson = learning_service.get_lesson_by_id(module_id, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")
    rec = learning_service.mark_lesson_read(db, module_id, lesson_id)
    return {
        "module_id": rec.module_id,
        "lesson_id": rec.lesson_id,
        "completed": rec.completed,
        "score": rec.score,
        "requires_quiz": bool(lesson.quiz),
    }


@router.post("/quiz/submit", response_model=QuizResultResponse)
def submit_quiz(submission: QuizSubmission, db: Session = Depends(get_db)):
    try:
        return learning_service.submit_quiz(db, submission)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
