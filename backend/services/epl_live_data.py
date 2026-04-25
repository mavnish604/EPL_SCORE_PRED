"""
Live data fetching from the Fantasy Premier League (FPL) API.
Adapted from the original root live_data.py — Streamlit caching replaced with
a TTL-based in-memory cache so this module is framework-agnostic.
"""

import os
import time
import threading

import pandas as pd
import requests

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
FPL_BOOTSTRAP_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"
FPL_FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/"

# Cache TTL in seconds (default: 1 hour). Override with env var.
CACHE_TTL_SECONDS = int(os.getenv("FPL_CACHE_TTL_SECONDS", "3600"))

# ---------------------------------------------------------------------------
# TTL-based cache internals
# ---------------------------------------------------------------------------
_cache_lock = threading.Lock()
_cached_result: tuple | None = None
_cached_at: float = 0.0


def _fetch_fpl_data_impl() -> tuple:
    """
    Internal fetch — hits the FPL API and returns (fixtures_df, id_to_name)
    or (None, None) on failure.
    """
    try:
        r_bootstrap = requests.get(FPL_BOOTSTRAP_URL, timeout=15).json()
        teams_df = pd.DataFrame(r_bootstrap["teams"])
        id_to_name: dict[int, str] = dict(zip(teams_df["id"], teams_df["name"]))

        r_fixtures = requests.get(FPL_FIXTURES_URL, timeout=15).json()
        fixtures_df = pd.DataFrame(r_fixtures)

        finished_games = fixtures_df[fixtures_df["finished"] == True].copy()  # noqa: E712
        finished_games["HomeTeam"] = finished_games["team_h"].map(id_to_name)
        finished_games["AwayTeam"] = finished_games["team_a"].map(id_to_name)
        finished_games["FTHG"] = finished_games["team_h_score"]
        finished_games["FTAG"] = finished_games["team_a_score"]
        finished_games["Date"] = pd.to_datetime(finished_games["kickoff_time"])
        finished_games = finished_games.sort_values("Date")

        return finished_games, id_to_name
    except Exception:
        return None, None


def fetch_fpl_data():
    """
    Public entry point — returns (fixtures_df, id_to_name).
    Results are cached in-memory and automatically expire after
    CACHE_TTL_SECONDS (default 3600).
    """
    global _cached_result, _cached_at

    now = time.monotonic()
    if _cached_result is not None and (now - _cached_at) < CACHE_TTL_SECONDS:
        return _cached_result

    with _cache_lock:
        # Double-check inside the lock to avoid thundering-herd refetches.
        if _cached_result is not None and (time.monotonic() - _cached_at) < CACHE_TTL_SECONDS:
            return _cached_result
        _cached_result = _fetch_fpl_data_impl()
        _cached_at = time.monotonic()
        return _cached_result


def clear_cache():
    """Call to invalidate the cached FPL data immediately."""
    global _cached_result, _cached_at
    with _cache_lock:
        _cached_result = None
        _cached_at = 0.0


# ---------------------------------------------------------------------------
# Helper functions consumed by the prediction service
# ---------------------------------------------------------------------------
def get_team_list() -> list[str]:
    """Returns a sorted list of all Premier League team names."""
    _, team_map = fetch_fpl_data()
    if team_map:
        return sorted(list(team_map.values()))
    return []


def fetch_live_form(team_name: str) -> tuple[float | None, float | None]:
    """
    Calculates form (Avg Scored, Avg Conceded) over the last 5 games.
    Returns (avg_scored, avg_conceded) or (None, None) on failure.
    """
    df, _ = fetch_fpl_data()
    if df is None:
        return None, None

    team_games = df[
        (df["HomeTeam"] == team_name) | (df["AwayTeam"] == team_name)
    ].tail(5)

    if len(team_games) == 0:
        return None, None

    goals_scored = 0
    goals_conceded = 0

    for _, row in team_games.iterrows():
        if row["HomeTeam"] == team_name:
            goals_scored += row["FTHG"]
            goals_conceded += row["FTAG"]
        else:
            goals_scored += row["FTAG"]
            goals_conceded += row["FTHG"]

    count = len(team_games)
    return goals_scored / count, goals_conceded / count
