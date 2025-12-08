import streamlit as st
import pandas as pd
import numpy as np
import joblib
from scipy.stats import poisson

from live_data import get_team_list, fetch_live_form

# -----------------------------------------------------------------------------
# 1. PAGE CONFIGURATION
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="EPL Match Predictor AI",
    page_icon="⚽",
    layout="wide"
)

# -----------------------------------------------------------------------------
# 2. GLOBAL CSS – CINEMATIC EPL UI (NO INPUT FIELD STYLING)
# -----------------------------------------------------------------------------
st.markdown(
    """
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Space+Grotesk:wght@400;600;700&display=swap');

        /* MAIN APP BACKGROUND + LAYOUT */
        .stApp {
            background:
                radial-gradient(circle at 10% 0%, #60108b 0, #22001f 35%, #050008 80%),
                radial-gradient(circle at 90% 100%, #002f47 0, #02020a 55%);
            font-family: 'Roboto', sans-serif;
        }

        .block-container {
            padding-top: 1.5rem !important;
            padding-bottom: 2.5rem !important;
            max-width: 1100px !important;
        }

        /* SIDEBAR */
        section[data-testid="stSidebar"] {
            background: linear-gradient(165deg, #0a0010, #220024);
            border-right: 1px solid rgba(255,255,255,0.08);
        }
        section[data-testid="stSidebar"] [data-testid="stMarkdown"] {
            color: #f7f7f7 !important;
            font-size: 0.9rem !important;
        }

        /* HEADER STYLE */
        .epl-header {
            text-align: center;
            padding: 18px 24px 14px 24px;
            border-radius: 22px;
            border: 1px solid rgba(0, 255, 133, 0.38);
            background:
                radial-gradient(circle at 0% 0%, rgba(0,255,133,0.16) 0, transparent 55%),
                radial-gradient(circle at 100% 100%, rgba(0,168,255,0.18) 0, transparent 55%),
                linear-gradient(135deg, rgba(56,0,60,0.9), rgba(10,0,25,0.98));
            box-shadow: 0 22px 60px rgba(0, 0, 0, 0.75);
            position: relative;
            overflow: hidden;
        }

        .epl-header::before {
            content: "";
            position: absolute;
            width: 180%;
            height: 180%;
            background: conic-gradient(from 210deg, #00ff85, #e90052, #00c2ff, #ffd700, #00ff85);
            top: -35%;
            left: -35%;
            opacity: 0.18;
            filter: blur(40px);
            animation: swirl 22s linear infinite;
            z-index: 0;
        }

        @keyframes swirl {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
        }

        .epl-header-inner {
            position: relative;
            z-index: 1;
        }

        .epl-header-title-row {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
        }

        .epl-logo-pill {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 20%, #ffffff 0, #ff5b9f 35%, #250019 90%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 22px rgba(0,0,0,0.7);
            font-size: 1.7rem;
        }

        .epl-header h1 {
            font-family: 'Space Grotesk', sans-serif;
            color: #ffffff;
            font-weight: 900;
            font-size: 2.7rem;
            letter-spacing: 0.18em;
            margin: 0;
            text-transform: uppercase;
        }

        .epl-header h1 span {
            color: #00ffb0;
        }

        .epl-subtitle {
            margin-top: 6px;
            color: #f3f3f3;
            font-size: 0.95rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
        }

        .epl-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 12px;
            padding: 6px 16px;
            border-radius: 999px;
            background: rgba(0,0,0,0.45);
            border: 1px solid rgba(255,255,255,0.18);
            font-size: 0.8rem;
            text-transform: uppercase;
            color: #ffffff;
            font-weight: 600;
        }

        .epl-pill span {
            color: #00ff85;
        }

        .epl-pill-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #00ff85;
            box-shadow: 0 0 10px #00ff85;
        }

        /* TEAM CARDS */
        .team-card {
            background:
                radial-gradient(circle at top left, rgba(233,0,82,0.26), rgba(8,0,20,0.96));
            border-radius: 18px;
            padding: 18px 18px 16px 18px;
            border: 1px solid rgba(255,255,255,0.12);
            box-shadow: 0 15px 38px rgba(0,0,0,0.78);
        }

        .team-title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .team-label {
            font-size: 0.9rem;
            font-weight: 800;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #fdfdfd;
        }

        .team-tag {
            padding: 3px 9px;
            border-radius: 999px;
            background: rgba(0,0,0,0.45);
            font-size: 0.7rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #ffdff0;
        }

        .team-name-display {
            margin-top: 6px;
            font-size: 1.15rem;
            font-weight: 700;
            color: #ffffff;
        }

        .team-extra-sub {
            margin-top: 4px;
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #cccccc;
            opacity: 0.7;
        }

        /* VS PILL */
        .vs-wrap {
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            height:100%;
        }

        .vs-pill {
            width: 86px;
            height: 86px;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 26px rgba(0,0,0,0.8);
            background: radial-gradient(circle, #2a002f 0%, #050009 75%);
        }
        .vs-pill-inner {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 3px solid #00ff85;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 1.5rem;
            color: #ffffff;
            letter-spacing: 0.16em;
        }

        .vs-caption {
            margin-top: 10px;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: #a6a6a6;
        }

        /* SCOREBOARD STYLE */
        .scoreboard {
            background:
                radial-gradient(circle at 0% 0%, rgba(0,255,133,0.14) 0, transparent 50%),
                radial-gradient(circle at 100% 100%, rgba(233,0,82,0.18) 0, transparent 55%),
                linear-gradient(135deg, #2c0030 0%, #120017 100%);
            border-radius: 20px;
            padding: 22px 20px 18px 20px;
            margin-top: 28px;
            border: 1px solid rgba(0,255,133,0.5);
            box-shadow: 0 18px 48px rgba(0,0,0,0.9);
            position: relative;
            overflow: hidden;
        }

        .scoreboard-inner {
            position: relative;
            z-index: 1;
        }

        .scoreboard-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.16);
            padding-bottom: 6px;
        }

        .scoreboard-team {
            font-size: 1.1rem;
            font-weight: 900;
            width: 40%;
            color: #ffffff;
            font-family: 'Space Grotesk', sans-serif;
        }

        .scoreboard-team.left {
            text-align: right;
        }

        .scoreboard-team.right {
            text-align: left;
        }

        .scoreboard-center-label {
            font-size: 0.78rem;
            color: #00ffb7;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            width: 20%;
            text-align: center;
        }

        .score-display {
            font-size: 3.4rem;
            font-weight: 900;
            color: #ffffff;
            text-shadow: 0 0 16px rgba(255,255,255,0.38);
            margin: 10px 0 6px 0;
            text-align: center;
            font-family: 'Space Grotesk', sans-serif;
        }

        /* PROGRESS BARS */
        .win-prob-bar-container {
            background-color: rgba(0,0,0,0.45);
            border-radius: 999px;
            height: 24px;
            width: 100%;
            margin-top: 12px;
            display: flex;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.2);
        }

        .prob-home { background: linear-gradient(90deg, #e90052, #ff5b9f); height: 100%; }
        .prob-draw { background: linear-gradient(90deg, #777777, #b1b1b1); height: 100%; }
        .prob-away { background: linear-gradient(90deg, #00ff85, #00c2ff); height: 100%; }

        .prob-label-row {
            display: flex;
            justify-content: space-between;
            margin-top: 6px;
            font-weight: bold;
            font-size: 0.85rem;
        }

        .prob-label-row div {
            text-transform: uppercase;
        }

        .prob-label-home {
            color: #ff7abf;
        }
        .prob-label-draw {
            color: #d5d5d5;
        }
        .prob-label-away {
            color: #87ffd2;
        }

        .prob-tags-row {
            display: flex;
            gap: 10px;
            margin-top: 14px;
            justify-content: center;
            flex-wrap: wrap;
            font-size: 0.78rem;
        }

        .prob-tag {
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(0,0,0,0.55);
            border: 1px solid rgba(255,255,255,0.16);
            color: #f5f5f5;
            text-transform: uppercase;
            letter-spacing: 0.09em;
        }

        /* FORM SNAPSHOT CARD */
        .form-snapshot-card {
            margin-top: 20px;
            padding: 14px 16px;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.16);
            background:
                radial-gradient(circle at 0% 0%, rgba(0,255,133,0.08) 0, transparent 55%),
                radial-gradient(circle at 100% 100%, rgba(0,144,255,0.12) 0, transparent 60%),
                linear-gradient(135deg, rgba(11,1,22,0.98), rgba(5,0,14,0.98));
            box-shadow: 0 14px 32px rgba(0,0,0,0.82);
            font-size: 0.88rem;
            color: #eeeeee;
        }

        .form-snapshot-title {
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-size: 0.78rem;
            color: #bfbfbf;
            margin-bottom: 6px;
        }

        .form-snapshot-team {
            font-weight: 600;
            color: #ffffff;
        }

        .form-snapshot-fallback {
            font-size: 0.75rem;
            color: #ffcc88;
            margin-top: 4px;
            opacity: 0.8;
        }

        /* FOOTER */
        .epl-footer {
            margin-top: 32px;
            text-align: center;
            font-size: 0.75rem;
            color: #a6a6a6;
            opacity: 0.78;
        }
        .epl-footer span {
            color: #00ff85;
            font-weight: 600;
        }

        /* METRIC CARDS */
        [data-testid="stMetric"] {
            background: rgba(0,0,0,0.45);
            padding: 10px 12px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.18);
            box-shadow: 0 12px 26px rgba(0,0,0,0.75);
        }

        [data-testid="stMetric"] label {
            color: #e0e0e0 !important;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 0.7rem;
        }

        [data-testid="stMetricValue"] {
            color: #ffffff !important;
            font-weight: 800 !important;
        }
    </style>
    """,
    unsafe_allow_html=True
)

# -----------------------------------------------------------------------------
# 3. LOAD MODELS
# -----------------------------------------------------------------------------
try:
    model_home = joblib.load('optimized_model_home.pkl')
    model_away = joblib.load('optimized_model_away.pkl')
except Exception:
    st.error("⚠️ Model files not found. Please ensure `.pkl` files are in the directory.")
    st.stop()

# -----------------------------------------------------------------------------
# 4. LOAD TEAM LIST
# -----------------------------------------------------------------------------
team_list = get_team_list()
if not team_list:
    st.error("Could not load team list from live data.")
    st.stop()

# Fallback averages if live form fetch fails
LEAGUE_FALLBACK_SCORED = 1.40
LEAGUE_FALLBACK_CONCEDED = 1.30

# -----------------------------------------------------------------------------
# 5. SIDEBAR CONTENT
# -----------------------------------------------------------------------------
with st.sidebar:
    st.markdown("## ⚽ EPL Predictor AI")
    st.markdown(
        """
        This is a **fully automated** pre-match insight engine.

        It uses:

        - 🧠 **XGBoost** models  
        - 📈 **Poisson goal distributions**  
        - 🔄 **Live form data** (last 5 games, fetched on-demand)

        ---
        **Workflow:**  
        1. Choose Home & Away teams  
        2. Click **Predict Match Result**  
        3. View xG, win probabilities & form snapshot  
        """
    )
    st.markdown("---")
    st.markdown("#### 🎨 Legend")
    st.markdown(
        """
        - <span style="color:#ff7abf;">Pink bar</span> – Home Win  
        - <span style="color:#d5d5d5;">Grey bar</span> – Draw  
        - <span style="color:#87ffd2;">Teal bar</span> – Away Win  
        """,
        unsafe_allow_html=True,
    )
    st.markdown("---")
    with st.expander("📜 View all valid EPL team names"):
        st.write("These are the exact names used by the model/live data:")
        for t in team_list:
            st.markdown(f"- **{t}**")

# -----------------------------------------------------------------------------
# 6. HEADER
# -----------------------------------------------------------------------------
st.markdown(
    """
    <div class="epl-header">
        <div class="epl-header-inner">
            <div class="epl-header-title-row">
                <div class="epl-logo-pill">🏆</div>
                <h1>EPL <span>PREDICTOR</span> AI</h1>
            </div>
            <div class="epl-subtitle">
                POISSON · XGBOOST · LIVE FORM ENGINE
            </div>
            <div class="epl-pill">
                <div class="epl-pill-dot"></div>
                <span>Magic Box</span> – No Manual Inputs
            </div>
        </div>
    </div>
    """,
    unsafe_allow_html=True
)

st.markdown("")

# -----------------------------------------------------------------------------
# 7. TEAM SELECTION ROW (ONLY DROPDOWNS)
# -----------------------------------------------------------------------------
col1, col2, col3 = st.columns([1.1, 0.4, 1.1])

with col1:
    st.markdown(
        """
        <div class="team-card">
            <div class="team-title-row">
                <div class="team-label">HOME TEAM</div>
                <div class="team-tag">HOST</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    home_name_input = st.selectbox("Home Team", team_list, key="h_input")
    st.markdown(
        f"<div class='team-name-display'>🔴 {home_name_input}</div>",
        unsafe_allow_html=True,
    )
    st.markdown(
        "<div class='team-extra-sub'>Form will be auto-fetched on prediction.</div>",
        unsafe_allow_html=True,
    )

with col2:
    st.markdown(
        """
        <div class="vs-wrap">
            <div class="vs-pill">
                <div class="vs-pill-inner">VS</div>
            </div>
            <div class="vs-caption">HEAD TO HEAD</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col3:
    st.markdown(
        """
        <div class="team-card">
            <div class="team-title-row">
                <div class="team-label">AWAY TEAM</div>
                <div class="team-tag">TRAVELLER</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    default_away_index = 1 if len(team_list) > 1 else 0
    away_name_input = st.selectbox(
        "Away Team",
        team_list,
        index=default_away_index,
        key="a_input"
    )
    st.markdown(
        f"<div class='team-name-display'>🔵 {away_name_input}</div>",
        unsafe_allow_html=True,
    )
    st.markdown(
        "<div class='team-extra-sub'>Travel factor captured via form & model.</div>",
        unsafe_allow_html=True,
    )

st.markdown("")

# -----------------------------------------------------------------------------
# 8. PREDICT BUTTON (CENTERED)
# -----------------------------------------------------------------------------
center_col = st.columns([1, 1, 1])[1]
with center_col:
    predict_clicked = st.button("PREDICT MATCH RESULT")

# -----------------------------------------------------------------------------
# 9. HELPER – SAFE FORM FETCH
# -----------------------------------------------------------------------------
def safe_fetch_form(team_name: str):
    """
    Fetch last-5-game form using live_data.fetch_live_form.
    Returns:
        scored, conceded, used_fallback (bool)
    """
    try:
        scored, conceded = fetch_live_form(team_name)
    except Exception:
        scored, conceded = None, None

    # If anything is off, fall back to league averages
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

# -----------------------------------------------------------------------------
# 10. PREDICTION LOGIC + OUTPUT
# -----------------------------------------------------------------------------
if predict_clicked:
    if home_name_input == away_name_input:
        st.error("Please select two different teams to run a prediction.")
    else:
        with st.spinner("Crunching live form and Poisson probabilities..."):
            # Fetch form on-demand (fully automated)
            h_scored, h_conceded, home_fallback = safe_fetch_form(home_name_input)
            a_scored, a_conceded, away_fallback = safe_fetch_form(away_name_input)

            # Prepare input for XGBoost models
            input_data = pd.DataFrame({
                'HomeTeam': [home_name_input],
                'AwayTeam': [away_name_input],
                'Home_GoalsScored_Last5': [h_scored],
                'Home_GoalsConceded_Last5': [h_conceded],
                'Away_GoalsScored_Last5': [a_scored],
                'Away_GoalsConceded_Last5': [a_conceded]
            })

            # Predict xG from models
            xg_home = float(model_home.predict(input_data)[0])
            xg_away = float(model_away.predict(input_data)[0])

            # Poisson distribution for scorelines
            max_goals = 10
            home_probs = poisson.pmf(np.arange(max_goals), xg_home)
            away_probs = poisson.pmf(np.arange(max_goals), xg_away)
            prob_matrix = np.outer(home_probs, away_probs)

            home_win_prob = float(np.sum(np.tril(prob_matrix, -1)))
            draw_prob = float(np.sum(np.diag(prob_matrix)))
            away_win_prob = float(np.sum(np.triu(prob_matrix, 1)))

            h_width = home_win_prob * 100
            d_width = draw_prob * 100
            a_width = away_win_prob * 100

        # SCOREBOARD UI
        st.markdown(
            f"""
            <div class="scoreboard">
                <div class="scoreboard-inner">
                    <div class="scoreboard-header-row">
                        <div class="scoreboard-team left">{home_name_input.upper()}</div>
                        <div class="scoreboard-center-label">XG PREDICTION</div>
                        <div class="scoreboard-team right">{away_name_input.upper()}</div>
                    </div>
                    <div class="score-display">{xg_home:.2f} - {xg_away:.2f}</div>
                    <div class="win-prob-bar-container">
                        <div class="prob-home" style="width: {h_width}%;"></div>
                        <div class="prob-draw" style="width: {d_width}%;"></div>
                        <div class="prob-away" style="width: {a_width}%;"></div>
                    </div>
                    <div class="prob-label-row">
                        <div class="prob-label-home">HOME {h_width:.1f}%</div>
                        <div class="prob-label-draw">DRAW {d_width:.1f}%</div>
                        <div class="prob-label-away">AWAY {a_width:.1f}%</div>
                    </div>
                    <div class="prob-tags-row">
                        <div class="prob-tag">HOME WIN · {home_name_input}</div>
                        <div class="prob-tag">DRAW</div>
                        <div class="prob-tag">AWAY WIN · {away_name_input}</div>
                    </div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        # METRIC CARDS
        m1, m2, m3 = st.columns(3)
        with m1:
            st.metric(label="Home Win Probability", value=f"{h_width:.1f}%")
        with m2:
            st.metric(label="Draw Probability", value=f"{d_width:.1f}%")
        with m3:
            st.metric(label="Away Win Probability", value=f"{a_width:.1f}%")

        # FORM SNAPSHOT (READ-ONLY, NO INPUTS)
        st.markdown(
            """
            <div class="form-snapshot-card">
                <div class="form-snapshot-title">RECENT FORM · LAST 5 GAMES (INFORMATIONAL)</div>
            """,
            unsafe_allow_html=True,
        )

        fs_home = f"<span class='form-snapshot-team'>{home_name_input}</span>: {h_scored:.2f} scored · {h_conceded:.2f} conceded"
        fs_away = f"<span class='form-snapshot-team'>{away_name_input}</span>: {a_scored:.2f} scored · {a_conceded:.2f} conceded"

        st.markdown(
            f"""
            <div>
                <div>{fs_home}</div>
                <div>{fs_away}</div>
            """,
            unsafe_allow_html=True,
        )

        if home_fallback or away_fallback:
            which = []
            if home_fallback:
                which.append(home_name_input)
            if away_fallback:
                which.append(away_name_input)
            teams_text = ", ".join(which)
            st.markdown(
                f"""
                <div class="form-snapshot-fallback">
                    Live form was unavailable for {teams_text}; using league-average fallback values.
                </div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        else:
            st.markdown(
                """
                <div class="form-snapshot-fallback">
                    Form metrics are computed from each team's last 5 league games.
                </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        st.write("")

        # LIGHT INSIGHT TEXT
        if home_win_prob > 0.60:
            st.success(
                f"💎 **INSIGHT:** The model shows a strong home tilt towards **{home_name_input}**."
                " Scorelines like 2–1 or 2–0 are statistically prominent."
            )
        elif away_win_prob > 0.60:
            st.success(
                f"💎 **INSIGHT:** The model favours **{away_name_input}** away from home."
                " Expect a game state where counters and transitions matter."
            )
        else:
            st.warning(
                "⚠️ **INSIGHT:** This fixture is in the balance. Probability mass is spread –"
                " markets are likely efficient, so avoid heavy straight-win exposure."
            )

# -----------------------------------------------------------------------------
# 11. FOOTER
# -----------------------------------------------------------------------------
st.markdown(
    """
    <div class="epl-footer">
        Built as a <span>pre-match insight layer</span>, not a guarantee machine.  
        Always add context: injuries, rotations, travel, tactics & schedule congestion.
    </div>
    """,
    unsafe_allow_html=True,
)
