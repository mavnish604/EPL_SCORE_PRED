"""
FastAPI entry point for the EPL Match Predictor backend.
Run with:  uvicorn main:app --reload --port 8000
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()  # reads backend/.env into os.environ
from fastapi.middleware.cors import CORSMiddleware

from routes.predict import router as predict_router

app = FastAPI(
    title="EPL Match Predictor API",
    description="XGBoost + Poisson prediction engine for Premier League fixtures",
    version="2.0.0",
)

# ---------------------------------------------------------------------------
# CORS — read allowed origins from env var (comma-separated), falling back
# to localhost defaults for local development.
# Example:  ALLOWED_ORIGINS=https://epl-predictor.vercel.app,http://localhost:3000
# ---------------------------------------------------------------------------
_DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

_env_origins = os.getenv("ALLOWED_ORIGINS", "")
_origins = [o.strip() for o in _env_origins.split(",") if o.strip()] if _env_origins else _DEFAULT_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Register routers
# ---------------------------------------------------------------------------
app.include_router(predict_router)


@app.get("/")
def root():
    return {"status": "ok", "message": "EPL Predictor API is running."}
