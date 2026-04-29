# EPL Match Predictor AI

![Python](https://img.shields.io/badge/Python-3.11%2B-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black)
![XGBoost](https://img.shields.io/badge/Model-XGBoost-orange)
![License](https://img.shields.io/badge/License-MIT-green)

A full-stack, professional-grade football prediction engine that uses **XGBoost** and **Poisson Distribution** to forecast English Premier League match results — complete with a sleek, animated analytics dashboard.

---

## 📖 About The Project

The **EPL Match Predictor AI** is a data-driven tool that calculates **Expected Goals (xG)** and **Win Probabilities** for any Premier League fixture. Select a home and away team, hit **Predict**, and get a full analytics breakdown in seconds.

It is built as a decoupled full-stack application:

- A **FastAPI** Python backend that runs the ML pipeline and serves predictions via a REST API.
- A **Next.js 16** frontend that consumes the API and renders a rich, animated analytics dashboard.

### ✨ Key Features

- **Hybrid AI Model** — Combines **XGBoost** (non-linear pattern recognition) with **Poisson Distribution** (scoreline probability matrix).
- **Live Form Detection** — Automatically fetches each team's last-5-game form from the **Fantasy Premier League (FPL) API** at prediction time. No manual data entry required.
- **Rich Analytics Dashboard** — Animated scoreboard (xG), win probability donut chart, outcome probability bar, xG comparison bars, Poisson heatmap, goal distribution chart, and recent form cards.
- **AI Insight Banner** — Automatically surfaces a contextual insight (e.g. "Strong Home Advantage" or "Tight Contest") based on the probability outputs.
- **Premium Dark UI** — Built with Tailwind CSS v4, shadcn/ui, and Framer Motion for smooth animations and micro-interactions. Fully responsive on mobile.

---

## 🛠️ Tech Stack

### Backend

| Tool               | Purpose                        |
| ------------------ | ------------------------------ |
| `FastAPI`        | REST API framework             |
| `Uvicorn`        | ASGI server                    |
| `XGBoost`        | ML model for xG prediction     |
| `Scikit-Learn`   | Model pipeline & preprocessing |
| `SciPy`          | Poisson probability matrix     |
| `Pandas / NumPy` | Data processing                |
| `Requests`       | Live FPL API calls             |

### Frontend

| Tool                | Purpose                            |
| ------------------- | ---------------------------------- |
| `Next.js 16`      | React framework (App Router)       |
| `Tailwind CSS v4` | Styling                            |
| `shadcn/ui`       | UI primitives                      |
| `Framer Motion`   | Animations                         |
| `Recharts`        | Goal distribution & heatmap charts |
| `Lucide React`    | Icons                              |

---

## How It Works

1. **Team Selection** — User picks a Home and Away team from a live-loaded dropdown.
2. **Live Form Fetch** — Backend queries the FPL API for each team's average goals scored & conceded over their last 5 matches.
3. **xG Prediction** — The form metrics are fed into two pre-trained XGBoost models:
   - `models/optimized_model_home.pkl` → Predicts Home xG
   - `models/optimized_model_away.pkl` → Predicts Away xG
4. **Poisson Matrix** — The xG values are used to build a 10×10 Poisson probability matrix, from which Home Win, Draw, and Away Win percentages are derived.
5. **Dashboard** — The full prediction payload is rendered as an animated analytics dashboard on the frontend.

---

## 💻 Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+

### 1. Clone the repo

```bash
git clone https://github.com/mavnish604/EPL_SCORE_PRED.git
cd EPL_SCORE_PRED
```

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

### 3. Start the Frontend

```bash
cd frontend-next
npm install
# Create the env file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
npm run dev
```

The app will be live at `http://localhost:3000`.

---

*Project built by Avnish Mishra — 2025.*
