"""SQLAlchemy ORM models for Quantum Lab."""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Experiment(Base):
    """Stores saved quantum circuit experiments."""

    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    circuit_config = Column(Text, nullable=False)  # JSON string
    num_qubits = Column(Integer, nullable=False)
    gate_count = Column(Integer, default=0)
    simulation_mode = Column(String(20), default="ideal")
    num_shots = Column(Integer, default=1024)
    results = Column(Text, nullable=True)  # JSON string
    notes = Column(Text, default="")
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class LearningProgress(Base):
    """Tracks per-lesson learning progress."""

    __tablename__ = "learning_progress"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    module_id = Column(String(100), nullable=False)
    lesson_id = Column(String(100), nullable=False)
    completed = Column(Boolean, default=False)
    score = Column(Float, default=0.0)
    completed_at = Column(DateTime, nullable=True)


class QuizResult(Base):
    """Stores quiz attempt results."""

    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    module_id = Column(String(100), nullable=False)
    quiz_id = Column(String(100), nullable=False)
    answers = Column(Text, nullable=False)  # JSON string
    score = Column(Integer, default=0)
    total = Column(Integer, default=0)
    passed = Column(Boolean, default=False)
    submitted_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )


class Achievement(Base):
    """Tracks earned achievements / badges."""

    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    icon = Column(String(100), default="🏆")
    earned_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
