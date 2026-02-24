"""
Live data fetching from the Fantasy Premier League (FPL) API.
Adapted from the original root live_data.py — Streamlit caching replaced with
functools.lru_cache so this module is framework-agnostic.
"""

import pandas as pd
import requests
from functools import lru_cache

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
FPL_BOOTSTRAP_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"
FPL_FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/"


# ---------------------------------------------------------------------------
# Core data fetching (cached for 1 hour via lru_cache)
# ---------------------------------------------------------------------------
@lru_cache(maxsize=1)
def _fetch_fpl_data_cached() -> tuple:
    """
    Internal cached fetch.  Returns (fixtures_df, id_to_name) or (None, None).
    Because lru_cache does not support TTL natively we expose a helper that
    can be called to clear the cache when needed.
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
    """Public wrapper – returns (fixtures_df, id_to_name)."""
    return _fetch_fpl_data_cached()


def clear_cache():
    """Call to invalidate the cached FPL data (e.g. on a schedule)."""
    _fetch_fpl_data_cached.cache_clear()


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
