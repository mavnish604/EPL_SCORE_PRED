import soccerdata as sd
import pandas as pd
import time
import os

# Define seasons
seasons = [year for year in range(1989, 2026)]
all_dfs = []

for season in seasons:
    print(f"--- Processing Season: {season} ---")
    try:
        # Initialize for one season only to keep request count low
        fbref = sd.FBref(leagues="ESP-La Liga", seasons=str(season))
        
        # Pull the data
        data = fbref.read_team_season_stats(stat_type="standard")
        all_dfs.append(data)
        
        # SUCCESS: Wait 10-15 seconds before the next season
        print(f"Season {season} complete. Sleeping...")
        time.sleep(12) 
        
    except Exception as e:
        print(f"Failed to pull {season}: {e}")
        # If blocked, wait much longer (e.g., 2 minutes) before trying next
        time.sleep(120)

# Combine and save if we got any data
if all_dfs:
    final_df = pd.concat(all_dfs).reset_index()
    final_df.to_csv("laliga_master_data.csv", index=False)
    print("Master file saved!")
