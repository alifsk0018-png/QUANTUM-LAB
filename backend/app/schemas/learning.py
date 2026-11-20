"""Pydantic v2 schemas for learning content, quizzes, and progress."""

from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class LessonContent(BaseModel):
    """A block of educational content inside a lesson."""

    type: str  # "text", "code", "diagram", "formula"
    content: str


class QuizQuestion(BaseModel):
    """A single multiple-choice quiz question."""

    id: str
    question: str
    options: list[str]
    correct_answer: int  # index into options
    explanation: str = ""


class Quiz(BaseModel):
    """Quiz attached to a lesson."""

    id: str
    title: str
    questions: list[QuizQuestion]
    passing_score: int = 70  # percentage


class Lesson(BaseModel):
    """A single lesson inside a module."""

    id: str
    title: str
    description: str
    content: list[LessonContent]
    quiz: Quiz | None = None
    order: int = 0


class Module(BaseModel):
    """A learning module grouping several lessons."""

    id: str
    title: str
    description: str
    level: str  # beginner / intermediate / advanced
    lessons: list[Lesson]
    icon: str = "📚"


class ModuleList(BaseModel):
    """List wrapper returned by the modules endpoint."""

    modules: list[Module]


# --------------- quiz submission / result ---------------


class QuizSubmission(BaseModel):
    """Payload when a user submits quiz answers."""

    module_id: str
    quiz_id: str
    answers: dict[str, int]  # question_id -> selected option index


class QuizResultResponse(BaseModel):
    """Result of grading a quiz submission."""

    quiz_id: str
    score: int
    total: int
    passed: bool
    percentage: float
    details: list[dict] = []


# --------------- progress ---------------


class LearningProgressResponse(BaseModel):
    """Per-lesson progress record."""

    module_id: str
    lesson_id: str
    completed: bool
    score: float
    completed_at: Optional[datetime] = None
