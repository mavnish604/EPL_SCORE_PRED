export interface TeamForm {
  scored: number;
  conceded: number;
  is_fallback: boolean;
}

export interface PredictionResult {
  xg_home: number;
  xg_away: number;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  poisson_matrix: number[][];
  form: {
    home: TeamForm;
    away: TeamForm;
  };
}
