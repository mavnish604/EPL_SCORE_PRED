import type { League, PredictionResult } from "@/types/prediction";
import type { Standing } from "@/types/standings";

export interface MatchInsights {
  homeCleanSheet: number;
  awayCleanSheet: number;
  over25Prob: number;
  bttsProb: number;
  homeXpts: number;
  awayXpts: number;
  verdict: string;
  isUpsetAlert: boolean;
  upsetReason: string | null;
}

export interface ClinchStatus {
  type: "champion" | "clinch" | "ucl" | "safe" | "relegated" | "playoff";
  label: string;
  badgeClass: string;
}

/**
 * Calculates FPL probabilities (Clean Sheet, Over 2.5, BTTS), expected points,
 * and dynamic AI match verdict directly from prediction models.
 */
export function calculateMatchInsights(
  prediction: PredictionResult,
  homeTeam: string,
  awayTeam: string,
  homeRank?: number,
  awayRank?: number
): MatchInsights {
  const xgHome = Math.max(0.01, prediction.xg_home ?? 1.2);
  const xgAway = Math.max(0.01, prediction.xg_away ?? 1.0);

  // Exact Poisson zero-probability: P(X = 0) = exp(-lambda)
  const homeCleanSheet = Math.min(99, Math.max(1, Math.round(Math.exp(-xgAway) * 100)));
  const awayCleanSheet = Math.min(99, Math.max(1, Math.round(Math.exp(-xgHome) * 100)));

  // Both teams to score: (1 - P(home=0)) * (1 - P(away=0))
  const bttsProb = Math.min(
    99,
    Math.max(1, Math.round((1 - Math.exp(-xgHome)) * (1 - Math.exp(-xgAway)) * 100))
  );

  // Over 2.5 goals: Calculate either from Poisson matrix or Poisson distribution
  let over25Prob = 0;
  if (Array.isArray(prediction.poisson_matrix) && prediction.poisson_matrix.length > 0) {
    let sum = 0;
    for (let h = 0; h < prediction.poisson_matrix.length; h++) {
      const row = prediction.poisson_matrix[h];
      if (Array.isArray(row)) {
        for (let a = 0; a < row.length; a++) {
          if (h + a >= 3) sum += row[a] ?? 0;
        }
      }
    }
    over25Prob = Math.min(99, Math.max(1, Math.round(sum * 100)));
  } else {
    // Total lambda = xgHome + xgAway
    const totalLambda = xgHome + xgAway;
    const p0 = Math.exp(-totalLambda);
    const p1 = totalLambda * p0;
    const p2 = (totalLambda * totalLambda * 0.5) * p0;
    over25Prob = Math.min(99, Math.max(1, Math.round((1 - (p0 + p1 + p2)) * 100)));
  }

  // Expected Points (xPts)
  const homeWinProb = prediction.home_win_prob ?? 33;
  const drawProb = prediction.draw_prob ?? 33;
  const awayWinProb = prediction.away_win_prob ?? 33;

  const homeXpts = Number(((3 * homeWinProb + 1 * drawProb) / 100).toFixed(1));
  const awayXpts = Number(((3 * awayWinProb + 1 * drawProb) / 100).toFixed(1));

  // Upset Alert Detection
  let isUpsetAlert = false;
  let upsetReason: string | null = null;

  if (homeRank != null && awayRank != null) {
    // Case 1: Away favorite is heavily favored by table (top 6 visiting bottom half)
    if (awayRank <= 6 && homeRank >= 11 && awayWinProb < 45) {
      isUpsetAlert = true;
      upsetReason = `${homeTeam} (#${homeRank}) primed to take points off ${awayTeam} (#${awayRank})`;
    }
    // Case 2: Home favorite vulnerable
    else if (homeRank <= 4 && awayRank >= 10 && homeWinProb < 42) {
      isUpsetAlert = true;
      upsetReason = `${awayTeam} (#${awayRank}) strong threat to hold ${homeTeam} (#${homeRank})`;
    }
    // Case 3: Lower-ranked team has higher win probability
    else if (homeRank - awayRank >= 6 && homeWinProb > awayWinProb + 10) {
      isUpsetAlert = true;
      upsetReason = `Underdog ${homeTeam} favored on model form`;
    }
  }

  // Dynamic AI Match Verdict
  let verdict = "";
  if (isUpsetAlert && upsetReason) {
    verdict = `Upset potential: ${upsetReason}. Expect a competitive trap game.`;
  } else if (homeWinProb >= 60) {
    verdict = `${homeTeam} are commanding favorites with high attacking output (${xgHome.toFixed(1)} xG).`;
  } else if (awayWinProb >= 55) {
    verdict = `${awayTeam} are favored to take all three points on the road (${xgAway.toFixed(1)} xG).`;
  } else if (drawProb >= 28 && Math.abs(homeWinProb - awayWinProb) <= 10) {
    verdict = `Closely matched tactical battle; high likelihood of points shared.`;
  } else if (over25Prob >= 65) {
    verdict = `High-scoring encounter anticipated with goals likely for both sides (${(xgHome + xgAway).toFixed(1)} total xG).`;
  } else if (over25Prob <= 38) {
    verdict = `Grinding, low-scoring defensive clash projected; first goal will be decisive.`;
  } else {
    verdict = `${homeWinProb >= awayWinProb ? homeTeam : awayTeam} hold a slight edge in a balanced matchup.`;
  }

  return {
    homeCleanSheet,
    awayCleanSheet,
    over25Prob,
    bttsProb,
    homeXpts,
    awayXpts,
    verdict,
    isUpsetAlert,
    upsetReason,
  };
}

/**
 * Calculates mathematical clinch, qualification, and relegation safety markers.
 */
export function calculateClinchStatus(
  standings: Standing[],
  league: League
): Map<string, ClinchStatus> {
  const result = new Map<string, ClinchStatus>();
  if (!standings || standings.length === 0) return result;

  const totalGames = league === "ucl" ? 8 : 38;

  // Domestic Leagues (EPL & La Liga)
  if (league !== "ucl" && standings.length >= 18) {
    const sorted = [...standings].sort((a, b) => a.rank - b.rank);
    const secondTeam = sorted[1];
    const fifthTeam = sorted[4];
    const seventeenthTeam = sorted[16];
    const eighteenthTeam = sorted[17];

    const secondMaxPts = secondTeam
      ? secondTeam.points + Math.max(0, totalGames - secondTeam.played) * 3
      : 0;
    const fifthMaxPts = fifthTeam
      ? fifthTeam.points + Math.max(0, totalGames - fifthTeam.played) * 3
      : 0;
    const eighteenthMaxPts = eighteenthTeam
      ? eighteenthTeam.points + Math.max(0, totalGames - eighteenthTeam.played) * 3
      : 0;

    for (const team of sorted) {
      const remaining = Math.max(0, totalGames - team.played);
      const teamMaxPts = team.points + remaining * 3;

      // 1st place champion or magic number
      if (team.rank === 1 && team.played >= 25) {
        if (team.points > secondMaxPts) {
          result.set(team.team, {
            type: "champion",
            label: "Champions",
            badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
          });
          continue;
        }
        const magicNumber = Math.max(1, secondMaxPts - team.points + 1);
        if (magicNumber <= remaining * 3 && magicNumber <= 15) {
          result.set(team.team, {
            type: "clinch",
            label: `Magic #${magicNumber}`,
            badgeClass: "bg-primary/15 text-primary border-primary/30",
          });
          continue;
        }
      }

      // Top 4 qualification locked
      if (team.rank <= 4 && team.played >= 28 && fifthMaxPts > 0 && team.points > fifthMaxPts) {
        result.set(team.team, {
          type: "ucl",
          label: "UCL Locked",
          badgeClass: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
        });
        continue;
      }

      // Mathematically safe from relegation
      if (team.rank <= 17 && team.played >= 26 && eighteenthMaxPts > 0 && team.points > eighteenthMaxPts) {
        result.set(team.team, {
          type: "safe",
          label: "Safe",
          badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
        });
        continue;
      }

      // Mathematically relegated
      if (team.rank >= 18 && team.played >= 28 && seventeenthTeam && teamMaxPts < seventeenthTeam.points) {
        result.set(team.team, {
          type: "relegated",
          label: "Relegated",
          badgeClass: "bg-destructive/15 text-destructive border-destructive/30",
        });
      }
    }
  }

  // Champions League League Phase (36 teams)
  if (league === "ucl" && standings.length >= 25) {
    const sorted = [...standings].sort((a, b) => a.rank - b.rank);
    const ninthTeam = sorted[8];
    const twentyFifthTeam = sorted[24];

    const ninthMaxPts = ninthTeam
      ? ninthTeam.points + Math.max(0, totalGames - ninthTeam.played) * 3
      : 0;
    const twentyFifthMaxPts = twentyFifthTeam
      ? twentyFifthTeam.points + Math.max(0, totalGames - twentyFifthTeam.played) * 3
      : 0;

    for (const team of sorted) {
      if (team.played >= 5) {
        if (team.rank <= 8 && ninthMaxPts > 0 && team.points > ninthMaxPts) {
          result.set(team.team, {
            type: "ucl",
            label: "Round of 16",
            badgeClass: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
          });
        } else if (team.rank <= 24 && twentyFifthMaxPts > 0 && team.points > twentyFifthMaxPts) {
          result.set(team.team, {
            type: "playoff",
            label: "Playoff Locked",
            badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
          });
        }
      }
    }
  }

  return result;
}

/**
 * Real-time What-If simulator: recalculates standings as user toggles outcomes.
 */
export function simulateStandings(
  baseStandings: Standing[],
  simulatedMatches: { homeTeam: string; awayTeam: string; outcome: "home" | "draw" | "away" }[]
): Standing[] {
  const tableMap = new Map<string, Standing>();

  for (const row of baseStandings) {
    tableMap.set(row.team, { ...row });
  }

  for (const sim of simulatedMatches) {
    const home = tableMap.get(sim.homeTeam);
    const away = tableMap.get(sim.awayTeam);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;

    if (sim.outcome === "home") {
      home.won += 1;
      home.points += 3;
      home.goals_for += 2;
      home.goals_against += 1;
      home.goal_difference += 1;

      away.lost += 1;
      away.goals_for += 1;
      away.goals_against += 2;
      away.goal_difference -= 1;
    } else if (sim.outcome === "away") {
      away.won += 1;
      away.points += 3;
      away.goals_for += 2;
      away.goals_against += 1;
      away.goal_difference += 1;

      home.lost += 1;
      home.goals_for += 1;
      home.goals_against += 2;
      home.goal_difference -= 1;
    } else {
      home.drawn += 1;
      home.points += 1;
      home.goals_for += 1;
      home.goals_against += 1;

      away.drawn += 1;
      away.points += 1;
      away.goals_for += 1;
      away.goals_against += 1;
    }
  }

  // Sort by points -> goal_difference -> goals_for -> alphabetical
  const updated = Array.from(tableMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return a.team.localeCompare(b.team);
  });

  return updated.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}
