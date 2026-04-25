"""
Live data fetching from the public ESPN Sports API (Free, Unlimited, Zero Rate Limits).
Provides match data in the exact format required for the prediction service.
Bypasses enterprise/university firewalls that block standard CSV sports data sites.
"""

import os
import time
import threading
from datetime import datetime
import requests
import urllib3
import pandas as pd

# Suppress the warning Python throws when bypassing the network's self-signed SSL certs
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
# Cache TTL in seconds (default: 1 hour). Override with env var.
CACHE_TTL_SECONDS = int(os.getenv("FOOTBALL_DATA_CACHE_TTL_SECONDS", "3600"))

# Mapping standard competition codes to ESPN's internal API codes
ESPN_COMP_CODE_MAP = {
    "PD": "esp.1",   # La Liga (Primera Division)
    "PL": "eng.1",   # Premier League
    "SA": "ita.1",   # Serie A
    "BL1": "ger.1",  # Bundesliga
    "FL1": "fra.1",  # Ligue 1
}

# ---------------------------------------------------------------------------
# TTL-based cache internals
# ---------------------------------------------------------------------------
_cache_lock = threading.Lock()
_cached_results: dict[str, tuple] = {}
_cached_ats: dict[str, float] = {}


def _get_espn_season_dates() -> str:
    """Calculates the date range for the current season (Aug 1 - May 31)."""
    now = datetime.now()
    year = now.year
    if now.month >= 8:
        return f"{year}0801-{year+1}0531"
    else:
        return f"{year-1}0801-{year}0531"


def _fetch_football_data_impl(competition_code: str = "PD") -> tuple:
    """
    Internal fetch — streams JSON from ESPN and returns (matches_df, team_names)
    or (None, None) on failure.
    """
    espn_code = ESPN_COMP_CODE_MAP.get(competition_code)
    if not espn_code:
        print(f"ERROR: Unsupported competition code: {competition_code}")
        return None, None

    url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/{espn_code}/scoreboard"
    params = {
        "dates": _get_espn_season_dates(), 
        "limit": 400
    }

    try:
        # verify=False bypasses local network self-signed certificates safely
        response = requests.get(url, params=params, timeout=15, verify=False)
        response.raise_for_status() 
        data = response.json()

        events = data.get("events", [])
        records = []
        
        for event in events:
            comp = event.get("competitions", [{}])[0]
            
            # Check if the game is actually finished
            is_completed = comp.get("status", {}).get("type", {}).get("completed", False)
            if not is_completed:
                continue
                
            competitors = comp.get("competitors", [])
            if len(competitors) != 2:
                continue
                
            home_team = next((c for c in competitors if c.get("homeAway") == "home"), None)
            away_team = next((c for c in competitors if c.get("homeAway") == "away"), None)
            
            if not home_team or not away_team:
                continue

            records.append({
                "Date": event.get("date"),
                "HomeTeam": home_team["team"]["name"],
                "AwayTeam": away_team["team"]["name"],
                "FTHG": float(home_team.get("score", 0)),
                "FTAG": float(away_team.get("score", 0)),
                "HTHG": None, # ESPN doesn't expose halftime scores at this endpoint
                "HTAG": None
            })

        if not records:
            print(f"No finished matches found for {competition_code}")
            return None, None

        matches_df = pd.DataFrame(records)
        
        # Handle the ISO date format correctly
        matches_df['Date'] = pd.to_datetime(matches_df['Date'], errors='coerce')
        matches_df = matches_df.sort_values("Date").reset_index(drop=True)

        # Extract unique, sorted list of teams
        team_names_set = set(matches_df["HomeTeam"]).union(set(matches_df["AwayTeam"]))
        team_names_list = sorted(list(team_names_set))

        return matches_df, team_names_list

    except Exception as e:
        print(f"Error fetching/parsing ESPN API data: {e}")
        return None, None


def fetch_football_data(competition_code: str = "PD"):
    """
    Public entry point — returns (matches_df, team_names_list).
    Results are cached in-memory per competition and automatically expire after
    CACHE_TTL_SECONDS (default 3600).
    """
    global _cached_results, _cached_ats

    now = time.monotonic()
    
    # Fast-path check without locking
    if competition_code in _cached_results:
        if (now - _cached_ats.get(competition_code, 0.0)) < CACHE_TTL_SECONDS:
            return _cached_results[competition_code]

    with _cache_lock:
        if competition_code in _cached_results:
            if (time.monotonic() - _cached_ats.get(competition_code, 0.0)) < CACHE_TTL_SECONDS:
                return _cached_results[competition_code]
                
        result = _fetch_football_data_impl(competition_code)
        _cached_results[competition_code] = result
        _cached_ats[competition_code] = time.monotonic()
        
        return result


def clear_cache(competition_code: str = None):
    """
    Call to invalidate the cached Football Data immediately.
    """
    global _cached_results, _cached_ats
    with _cache_lock:
        if competition_code and competition_code in _cached_results:
            del _cached_results[competition_code]
            del _cached_ats[competition_code]
        elif not competition_code:
            _cached_results.clear()
            _cached_ats.clear()


# ---------------------------------------------------------------------------
# Helper functions consumed by the prediction service
# ---------------------------------------------------------------------------
def get_team_list(competition_code: str = "PD") -> list[str]:
    """Returns a sorted list of all team names for the given competition."""
    _, team_names = fetch_football_data(competition_code)
    if team_names:
        return team_names
    return []


def fetch_live_form(team_name: str, competition_code: str = "PD") -> tuple[float | None, float | None]:
    """Calculates form (Avg Scored, Avg Conceded) over the last 5 games."""
    df, _ = fetch_football_data(competition_code)
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

# if __name__ == "__main__":
#     print("Testing ESPN Football API Fetcher...\n")

#     print("1. Fetching recent matches...")
#     df, teams = fetch_football_data("PD")
    
#     if df is not None:
#         print(f"Successfully fetched {len(df)} finished matches.")
#         print("Latest 3 matches in the dataset:")
#         print(df.tail(3).to_string(index=False))
#     else:
#         print("Failed to fetch match data.")

#     print("\n" + "-"*50 + "\n")

#     print("2. Fetching team list...")
#     if teams:
#         print(f"Found {len(teams)} teams. Here are the first 5:")
#         print(", ".join(teams[:5]))
    
#     print("\n" + "-"*50 + "\n")

#     test_team = "Barcelona" 
#     print(f"3. Calculating live form for {test_team}...")
    
#     scored, conceded = fetch_live_form(test_team, "PD")
    
#     if scored is not None:
#         print(f"{test_team} - Last 5 Games:")
#         print(f"Average Goals Scored: {scored:.1f}")
#         print(f"Average Goals Conceded: {conceded:.1f}")
#     else:
#         print(f"Could not calculate form for {test_team}. Check if the name matches the list exactly.")
        
#     print("\n" + "-"*50 + "\n")
#     print("Test complete!")