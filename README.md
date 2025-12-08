# ⚽ EPL Match Predictor AI

[![Streamlit App](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://epl-pred.streamlit.app/)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![XGBoost](https://img.shields.io/badge/Model-XGBoost-orange)
![License](https://img.shields.io/badge/License-MIT-green)

A professional-grade football prediction engine that uses **Machine Learning (XGBoost)** and **Poisson Distribution** logic to forecast English Premier League match results.

### 🔴 [Live Demo: epl-pred.streamlit.app](https://epl-pred.streamlit.app/)

---

## 📖 About The Project

This is not just another random number generator. The **EPL Match Predictor AI** is a data-driven tool designed to find value in the betting market by calculating **Expected Goals (xG)** and **Win Probabilities** for upcoming fixtures.

It features a custom-built, "Glassmorphism" UI inspired by the official Premier League design system, ensuring that the analytics look as good as they perform.

### ✨ Key Features

* **🧠 Hybrid AI Model:** Combines **XGBoost** (for non-linear pattern recognition) with **Poisson Regression** (for accurate scoreline probabilities).
* **🔄 Live Form Detection:** Automatically connects to the **Fantasy Premier League (FPL) API** to fetch the latest "Last 5 Games" form for every team. No manual data entry required.
* **📊 Dynamic Dashboard:** Visualizes Win/Draw/Loss probabilities with real-time progress bars.
* **💎 Betting Insights:** Automatically flags "High Value" opportunities when the model's confidence exceeds 60%.
* **🎨 Premium UI:** Custom CSS implementation featuring the official EPL color palette (Deep Purple & Neon Green).

---

## 🛠️ Tech Stack

* **Core Logic:** `Python`
* **Machine Learning:** `XGBoost`, `Scikit-Learn`, `SciPy` (Poisson)
* **Data Processing:** `Pandas`, `NumPy`
* **Web Framework:** `Streamlit`
* **Live Data Source:** `FPL API` (Fantasy Premier League)

---

## 🚀 How It Works

1.  **Data Fetching:** When you select two teams, the app queries the live FPL API to retrieve their most recent match results.
2.  **Feature Engineering:** It calculates specific "Form Metrics" (Average Goals Scored & Conceded over the last 5 games).
3.  **Prediction:** These metrics are fed into two pre-trained XGBoost models:
    * `optimized_model_home.pkl`: Predicts Home Team Goals.
    * `optimized_model_away.pkl`: Predicts Away Team Goals.
4.  **Probability Matrix:** The predicted xG values are run through a **Poisson Distribution Matrix** to simulate 10,000 possible match outcomes and calculate the exact percentage chance of a Home Win, Draw, or Away Win.

---

## 💻 Local Installation

Want to run this locally? Follow these steps:

1.  **Clone the Repo**
    ```bash
    git clone [https://github.com/mavnish604/EPL_SCORE_PRED.git](https://github.com/mavnish604/EPL_SCORE_PRED.git)
    cd EPL_SCORE_PRED
    ```

2.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the App**
    ```bash
    streamlit run app.py
    ```

---

## 📂 Project Structure

```text
EPL_SCORE_PRED/
├── app.py                   # Main application interface & logic
├── live_data.py             # Script to fetch real-time data from FPL API
├── optimized_model_home.pkl # Trained XGBoost model for Home Goals
├── optimized_model_away.pkl # Trained XGBoost model for Away Goals
├── requirements.txt         # List of python dependencies
└── README.md                # Documentation
 

Project built by Avnish Mishra in 2025.