"""
Prediction service — extracts all ML + Poisson logic from the original app.py
so it can be consumed by the FastAPI route layer.
"""

import os
import numpy as np
import pandas as pd
import joblib
from scipy.stats import poisson

# Updated to match the new ESPN data fetcher
from services.la_liga_data import fetch_live_form

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
LEAGUE_FALLBACK_SCORED = 1.40
LEAGUE_FALLBACK_CONCEDED = 1.30
MAX_GOALS = 10  

# ---------------------------------------------------------------------------
# Model loading 
# ---------------------------------------------------------------------------
_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models") # Adjusted path assuming standard backend structure

try:
    model_home = joblib.load(os.path.join(_MODELS_DIR, "EPL_home_model.pkl"))
    model_away = joblib.load(os.path.join(_MODELS_DIR, "EPL_away_model.pkl"))
except FileNotFoundError as e:
    print(f"WARNING: ML models not found. Predictions will fail. {e}")
    model_home, model_away = None, None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _safe_fetch_form(team_name: str, comp_code: str = "PL") -> tuple[float, float, bool]:
    """
    Fetch last-5-game form. Returns (scored, conceded, used_fallback).
    """
    try:
        scored, conceded = fetch_live_form(team_name, competition_code=comp_code)
    except Exception:
        scored, conceded = None, None

    if scored is None or conceded is None:
        return LEAGUE_FALLBACK_SCORED, LEAGUE_FALLBACK_CONCEDED, True

    try:
        s = float(scored)
        c = float(conceded)
        if np.isnan(s) or np.isnan(c):
            raise ValueError
    except Exception:
        return LEAGUE_FALLBACK_SCORED, LEAGUE_FALLBACK_CONCEDED, True

    return s, c, False

# ---------------------------------------------------------------------------
# Main prediction function
# ---------------------------------------------------------------------------
def predict_match(home_team: str, away_team: str, comp_code: str = "PL") -> dict:
    """
    Run the full prediction pipeline for a fixture.
    Returns a dict matching the API response schema.
    """
    if not model_home or not model_away:
        raise RuntimeError("ML Models are not loaded into memory.")

    # 1. Fetch form
    h_scored, h_conceded, home_fallback = _safe_fetch_form(home_team, comp_code)
    a_scored, a_conceded, away_fallback = _safe_fetch_form(away_team, comp_code)

    # 2. Build feature DataFrame
    input_data = pd.DataFrame(
        {
            "HomeTeam": [home_team],
            "AwayTeam": [away_team],
            "Home_GoalsScored_Last5": [h_scored],
            "Home_GoalsConceded_Last5": [h_conceded],
            "Away_GoalsScored_Last5": [a_scored],
            "Away_GoalsConceded_Last5": [a_conceded],
        }
    )

    # 3. Predict xG
    xg_home = float(model_home.predict(input_data)[0])
    xg_away = float(model_away.predict(input_data)[0])

    # 4. Poisson probability matrix
    home_probs = poisson.pmf(np.arange(MAX_GOALS), xg_home)
    away_probs = poisson.pmf(np.arange(MAX_GOALS), xg_away)
    prob_matrix = np.outer(home_probs, away_probs)

    home_win_prob = float(np.sum(np.tril(prob_matrix, -1))) * 100
    draw_prob = float(np.sum(np.diag(prob_matrix))) * 100
    away_win_prob = float(np.sum(np.triu(prob_matrix, 1))) * 100

    # 5. Build response
    return {
        "xg_home": round(xg_home, 2),
        "xg_away": round(xg_away, 2),
        "home_win_prob": round(home_win_prob, 1),
        "draw_prob": round(draw_prob, 1),
        "away_win_prob": round(away_win_prob, 1),
        "poisson_matrix": [
            [round(float(prob_matrix[h][a]), 4) for a in range(MAX_GOALS)]
            for h in range(MAX_GOALS)
        ],
        "form": {
            "home": {
                "scored": round(h_scored, 2),
                "conceded": round(h_conceded, 2),
                "is_fallback": home_fallback,
            },
            "away": {
                "scored": round(a_scored, 2),
                "conceded": round(a_conceded, 2),
                "is_fallback": away_fallback,
            },
        },
    }

# ---------------------------------------------------------------------------
# Standalone Testing Block
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("Testing End-to-End Prediction Service...\n")
    
    # We will test using Premier League teams assuming your .pkl models were trained on EPL data
    test_home = "Arsenal"
    test_away = "Chelsea"
    test_comp = "PL"
    
    print(f"Matchup: {test_home} (Home) vs {test_away} (Away) [{test_comp}]")
    print("Fetching live form and running ML inference...\n")
    
    try:
        result = predict_match(test_home, test_away, comp_code=test_comp)
        
        print("--- PREDICTION RESULTS ---")
        print(f"Expected Goals:   {test_home} {result['xg_home']} - {result['xg_away']} {test_away}")
        print(f"Home Win Prob:    {result['home_win_prob']}%")
        print(f"Draw Prob:        {result['draw_prob']}%")
        print(f"Away Win Prob:    {result['away_win_prob']}%")
        
        print("\n--- LIVE FORM DATA USED (Last 5 Games) ---")
        print(f"{test_home} Form -> Scored: {result['form']['home']['scored']}, Conceded: {result['form']['home']['conceded']}")
        if result['form']['home']['is_fallback']:
             print(f"  * Warning: Using fallback data for {test_home}. Check spelling.")
             
        print(f"{test_away} Form -> Scored: {result['form']['away']['scored']}, Conceded: {result['form']['away']['conceded']}")
        if result['form']['away']['is_fallback']:
             print(f"  * Warning: Using fallback data for {test_away}. Check spelling.")
             
        print("\nTest completed successfully!")
        
    except Exception as e:
        print(f"\n[!] Test Failed: {e}")
        print("Tip: If models failed to load, verify your 'optimized_model_home.pkl' is in the /models/ directory relative to this script.")