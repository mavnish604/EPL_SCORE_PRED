import pandas as pd
import streamlit as st
import requests

# -----------------------------------------------------------------------------
# CONSTANTS (FPL API)
# -----------------------------------------------------------------------------
FPL_BOOTSTRAP_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"
FPL_FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/"

# -----------------------------------------------------------------------------
# CORE DATA FETCHING
# -----------------------------------------------------------------------------
@st.cache_data(ttl=3600)
def fetch_fpl_data():
    """
    Fetches latest results and team mapping from FPL API.
    Returns: (fixtures_dataframe, team_id_to_name_dict)
    """
    try:
        # 1. Get Team Names & IDs
        r_bootstrap = requests.get(FPL_BOOTSTRAP_URL).json()
        teams_df = pd.DataFrame(r_bootstrap['teams'])
        id_to_name = dict(zip(teams_df['id'], teams_df['name']))
        
        # 2. Get Fixtures
        r_fixtures = requests.get(FPL_FIXTURES_URL).json()
        fixtures_df = pd.DataFrame(r_fixtures)
        
        # Filter: Finished games only
        finished_games = fixtures_df[fixtures_df['finished'] == True].copy()
        
        # Map IDs to Names
        finished_games['HomeTeam'] = finished_games['team_h'].map(id_to_name)
        finished_games['AwayTeam'] = finished_games['team_a'].map(id_to_name)
        
        # Rename Score Columns
        finished_games['FTHG'] = finished_games['team_h_score']
        finished_games['FTAG'] = finished_games['team_a_score']
        
        # Sort by Date
        finished_games['Date'] = pd.to_datetime(finished_games['kickoff_time'])
        finished_games = finished_games.sort_values('Date')
        
        return finished_games, id_to_name

    except Exception as e:
        return None, None

# -----------------------------------------------------------------------------
# HELPER FUNCTIONS (Imported by app.py)
# -----------------------------------------------------------------------------

def get_team_list():
    """Returns a sorted list of all Premier League team names."""
    _, team_map = fetch_fpl_data()
    if team_map:
        return sorted(list(team_map.values()))
    return []

def fetch_live_form(team_name):
    """
    Calculates form (Avg Scored, Avg Conceded) for the last 5 games.
    """
    df, _ = fetch_fpl_data()
    
    if df is None:
        return None, None
    
    # Filter games for specific team
    team_games = df[(df['HomeTeam'] == team_name) | (df['AwayTeam'] == team_name)].tail(5)
    
    if len(team_games) == 0:
        return None, None

    goals_scored = 0
    goals_conceded = 0
    
    for _, row in team_games.iterrows():
        if row['HomeTeam'] == team_name:
            goals_scored += row['FTHG']
            goals_conceded += row['FTAG']
        else: # Played Away
            goals_scored += row['FTAG']
            goals_conceded += row['FTHG']
    
    count = len(team_games)
    return goals_scored / count, goals_conceded / count