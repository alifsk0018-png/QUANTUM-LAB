"""Main FastAPI application entry point for QUANTUM LAB."""

import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from .database.database import create_tables, get_db
from .database.models import QuizResult
from .routes import simulation, experiments, learning, tutor
from .services import experiment_service, learning_service

load_dotenv()

# Simple in-memory sliding-window rate limiter for expensive endpoints
_RATE_BUCKETS: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_MAX_REQUESTS = int(os.getenv("RATE_LIMIT_PER_MIN", "120"))
MAX_REQUEST_BODY_BYTES = int(os.getenv("MAX_REQUEST_BODY_BYTES", str(2 * 1024 * 1024)))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    create_tables()
    yield


app = FastAPI(
    title="QUANTUM LAB API",
    description="AI-Powered Interactive Quantum Computing Laboratory — Qiskit Simulation, Learning Academy & Q-ASSIST.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration from environment
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    # 1. Request body size check
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            length_val = int(content_length)
        except ValueError:
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid Content-Length header."},
            )
        if length_val > MAX_REQUEST_BODY_BYTES:
            return JSONResponse(
                status_code=413,
                content={"detail": "Request payload exceeds maximum allowed size."},
            )

    # 2. Rate limiting on compute-heavy endpoints
    if request.url.path in ("/api/simulate", "/api/tutor/explain", "/api/tutor/chat"):
        client_ip = request.client.host if request.client else "local"
        now = time.time()
        window_start = now - 60.0
        bucket = [t for t in _RATE_BUCKETS[client_ip] if t > window_start]
        if len(bucket) >= RATE_LIMIT_MAX_REQUESTS:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please wait a moment before retrying."},
            )
        bucket.append(now)
        _RATE_BUCKETS[client_ip] = bucket

    return await call_next(request)


@app.exception_handler(Exception)
async def global_exception_handler(_request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# Register routers
app.include_router(simulation.router)
app.include_router(experiments.router)
app.include_router(learning.router)
app.include_router(tutor.router)


@app.get("/api/health", tags=["System"])
def health_check():
    """Verify backend health, Qiskit availability, and AI configuration status."""
    aer_available = False
    qiskit_version = "unknown"
    try:
        import qiskit
        qiskit_version = qiskit.__version__
    except Exception:
        pass
    try:
        import qiskit_aer  # noqa: F401
        aer_available = True
    except Exception:
        pass

    provider = (os.getenv("AI_PROVIDER", "gemini") or "gemini").strip().lower()
    default_models = {
        "gemini": "gemini-2.0-flash",
        "openai": "gpt-4o-mini",
        "anthropic": "claude-3-5-sonnet-latest",
    }
    return {
        "status": "healthy",
        "service": "QUANTUM LAB Backend",
        "version": "1.0.0",
        "qiskit_version": qiskit_version,
        "aer_available": aer_available,
        "ai_configured": bool(os.getenv("AI_API_KEY", "").strip()),
        "ai_provider": provider,
        "ai_model": (os.getenv("AI_MODEL", "") or "").strip() or default_models.get(provider, "gemini-2.0-flash"),
        "max_qubits": int(os.getenv("MAX_QUBITS", "8")),
        "max_shots": int(os.getenv("MAX_SHOTS", "10000")),
    }


def _norm_ts(dt: datetime | None) -> float:
    if dt is None:
        return 0.0
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.timestamp()


@app.get("/api/dashboard/summary", tags=["System"])
def dashboard_summary(db: Session = Depends(get_db)):
    """Aggregate real dashboard statistics and recent activity from the database."""
    exp_stats = experiment_service.get_experiment_stats(db)
    learn_stats = learning_service.get_learning_stats(db)
    recent_exps, _ = experiment_service.get_experiments(db, skip=0, limit=5)
    recent_quizzes = (
        db.query(QuizResult)
        .filter(QuizResult.passed == True)  # noqa: E712
        .order_by(QuizResult.submitted_at.desc())
        .limit(4)
        .all()
    )
    recent_achievements = learning_service.get_achievements(db)[:3]

    activity_items: list[tuple[float, dict]] = []
    for e in recent_exps:
        activity_items.append(
            (
                _norm_ts(e.created_at),
                {
                    "type": "experiment",
                    "id": e.id,
                    "title": e.name,
                    "subtitle": f"{e.num_qubits}Q · {e.gate_count} gates · {e.simulation_mode} mode",
                    "timestamp": e.created_at.isoformat() if e.created_at else None,
                },
            )
        )
    for q in recent_quizzes:
        activity_items.append(
            (
                _norm_ts(q.submitted_at),
                {
                    "type": "quiz",
                    "id": q.id,
                    "title": f"Passed quiz: {q.quiz_id}",
                    "subtitle": f"Module: {q.module_id} · Score {q.score}/{q.total}",
                    "timestamp": q.submitted_at.isoformat() if q.submitted_at else None,
                },
            )
        )
    for a in recent_achievements:
        activity_items.append(
            (
                _norm_ts(a.earned_at),
                {
                    "type": "achievement",
                    "id": a.id,
                    "title": f"Badge earned: {a.name}",
                    "subtitle": a.description,
                    "timestamp": a.earned_at.isoformat() if a.earned_at else None,
                },
            )
        )

    activity_items.sort(key=lambda item: item[0], reverse=True)
    recent_activity = [item[1] for item in activity_items[:8]]

    return {
        "stats": {
            "total_experiments": exp_stats["total_experiments"],
            "saved_circuits": exp_stats["total_circuits"],
            "completed_lessons": learn_stats["completed_lessons"],
            "total_lessons": learn_stats["total_lessons"],
            "challenges_completed": learn_stats["challenges_completed"],
            "achievements_count": learn_stats["achievements_count"],
        },
        "recent_activity": recent_activity,
    }
