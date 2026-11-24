import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const source = await readFile(new URL("../lib/analytics.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
vm.runInNewContext(compiled, { exports });
const { calculateMatchInsights, calculateClinchStatus, simulateStandings } = exports;

test("calculateMatchInsights computes valid probabilities and xPts", () => {
  const dummyPrediction = {
    xg_home: 1.8,
    xg_away: 0.9,
    home_win_prob: 58,
    draw_prob: 24,
    away_win_prob: 18,
    poisson_matrix: [],
    form: {
      home: { scored: 1.8, conceded: 0.9, is_fallback: false },
      away: { scored: 1.1, conceded: 1.4, is_fallback: false },
    },
  };

  const insights = calculateMatchInsights(dummyPrediction, "Arsenal", "Chelsea", 1, 8);

  assert.ok(insights.homeCleanSheet > 0 && insights.homeCleanSheet < 100);
  assert.ok(insights.awayCleanSheet > 0 && insights.awayCleanSheet < 100);
  assert.ok(insights.over25Prob > 0 && insights.over25Prob < 100);
  assert.ok(insights.bttsProb > 0 && insights.bttsProb < 100);
  assert.equal(typeof insights.homeXpts, "number");
  assert.equal(typeof insights.awayXpts, "number");
  assert.ok(insights.verdict.length > 10);
});

test("calculateMatchInsights flags trap game upset alert", () => {
  const upsetPrediction = {
    xg_home: 1.4,
    xg_away: 1.1,
    home_win_prob: 40,
    draw_prob: 30,
    away_win_prob: 30,
    poisson_matrix: [],
    form: {
      home: { scored: 1.2, conceded: 1.1, is_fallback: false },
      away: { scored: 1.3, conceded: 1.2, is_fallback: false },
    },
  };

  const insights = calculateMatchInsights(upsetPrediction, "Wolves", "Chelsea", 14, 4);
  assert.equal(insights.isUpsetAlert, true);
  assert.ok(insights.upsetReason?.includes("Chelsea"));
});

test("simulateStandings applies What-If outcome correctly", () => {
  const base = [
    { rank: 1, team: "Arsenal", played: 10, won: 8, drawn: 1, lost: 1, goals_for: 20, goals_against: 8, goal_difference: 12, points: 25 },
    { rank: 2, team: "Man City", played: 10, won: 7, drawn: 2, lost: 1, goals_for: 22, goals_against: 10, goal_difference: 12, points: 23 },
  ];

  const updated = simulateStandings(base, [
    { homeTeam: "Man City", awayTeam: "Arsenal", outcome: "home" },
  ]);

  assert.equal(updated[0].team, "Man City");
  assert.equal(updated[0].points, 26);
  assert.equal(updated[0].rank, 1);
  assert.equal(updated[1].team, "Arsenal");
  assert.equal(updated[1].points, 25);
  assert.equal(updated[1].rank, 2);
});
