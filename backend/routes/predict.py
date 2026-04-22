"""
API routes for the EPL Predictor.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.live_data import get_team_list
from services.prediction import predict_match

router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class PredictRequest(BaseModel):
    home_team: str = Field(..., min_length=1, max_length=100)
    away_team: str = Field(..., min_length=1, max_length=100)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("/teams")
def teams():
    """Return sorted list of all EPL team names from the live FPL API."""
    team_list = get_team_list()
    if not team_list:
        raise HTTPException(status_code=503, detail="Could not load team list from FPL API.")
    return team_list


@router.post("/predict")
def predict(body: PredictRequest):
    """Run prediction for a home vs away fixture."""
    if body.home_team == body.away_team:
        raise HTTPException(status_code=400, detail="Home and away teams must be different.")

    team_list = get_team_list()
    if body.home_team not in team_list:
        raise HTTPException(status_code=400, detail=f"Unknown home team: {body.home_team}")
    if body.away_team not in team_list:
        raise HTTPException(status_code=400, detail=f"Unknown away team: {body.away_team}")

    result = predict_match(body.home_team, body.away_team)
    return result
