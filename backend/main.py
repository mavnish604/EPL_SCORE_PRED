"""
FastAPI entry point for the EPL Match Predictor backend.
Run with:  uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.predict import router as predict_router

app = FastAPI(
    title="EPL Match Predictor API",
    description="XGBoost + Poisson prediction engine for Premier League fixtures",
    version="2.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server (and any localhost origin)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
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
