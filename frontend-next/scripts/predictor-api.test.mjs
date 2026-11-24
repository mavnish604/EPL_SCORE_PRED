import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const source = await readFile(new URL("../lib/api/predictor.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function client(base, payload, ok = true) {
  const calls = [];
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, process: { env: { NEXT_PUBLIC_API_URL: base } },
    fetch: async (url, options) => { calls.push({ url, options }); return { ok, status: ok ? 200 : 502, json: async () => payload }; },
  });
  return { api: exports, calls };
}

test("backend origins and /api URLs resolve to identical prediction endpoints", async () => {
  for (const base of ["https://backend.example", "https://backend.example/api/"]) {
    const { api, calls } = client(base, ["Arsenal", "Chelsea"]);
    await api.fetchTeams("epl");
    assert.equal(calls[0].url, "https://backend.example/api/epl/teams");
  }
});

test("La Liga uses the shared domestic roster instead of its deprecated endpoint", async () => {
  const { api, calls } = client("https://backend.example/api", { teams: ["Barcelona", "Real Madrid"] });
  const names = await api.fetchTeams("laliga");
  assert.deepEqual(Array.from(names), ["Barcelona", "Real Madrid"]);
  assert.equal(calls[0].url, "https://backend.example/api/teams?league=spain");
});

test("UCL sends selected model names unchanged and includes both domestic leagues", async () => {
  const { api, calls } = client("https://backend.example/api", { xg_home: 1.2, xg_away: 0.7, home_win_prob: 50, draw_prob: 30, away_win_prob: 20, poisson_matrix: [], form_used: { home: { scored_last5: 1.3, conceded_last5: 0.4, is_fallback: true } } });
  const prediction = await api.fetchPrediction("Real Madrid", "Manchester City", "ucl", "spain", "england");
  assert.deepEqual(JSON.parse(calls[0].options.body), { home_team: "Real Madrid", away_team: "Manchester City", home_league: "spain", away_league: "england" });
  assert.equal(calls[0].url, "https://backend.example/api/ucl/predict");
  assert.equal(prediction.form.home.scored, 1.3);
  assert.equal(prediction.form.home.is_fallback, true);
});

test("backend detail messages reach the frontend", async () => {
  const { api } = client("https://backend.example", { detail: "Fixture teams do not match the standings." }, false);
  await assert.rejects(() => api.fetchTeams("epl"), /Fixture teams do not match the standings/);
});

test("standings and fixtures use the league routes outside /api", async () => {
  for (const league of ["epl", "laliga", "ucl"]) {
    const { api, calls } = client("https://backend.example/api", []);
    await api.fetchStandings(league, true);
    await api.fetchStandings(league, false);
    await api.fetchFixtures(league);
    assert.deepEqual(calls.map(({ url }) => url), [
      `https://backend.example/${league}/predicted_table`,
      `https://backend.example/${league}/standings`,
      `https://backend.example/${league}/get_fixtures`,
    ]);
  }
});

test("UCL fixture leagues do not guess when a club is unknown", async () => {
  const source = await readFile(new URL("../lib/uclFixtureLeagues.ts", import.meta.url), "utf8");
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports });
  assert.equal(exports.getUclFixtureLeague("Bodo/Glimt"), "norway");
  assert.equal(exports.getUclFixtureLeague("PSV Eindhoven"), "netherlands");
  assert.equal(exports.getUclFixtureLeague("Unknown FC"), undefined);
});

test("updated UCL form inputs stay distinct from the original venue averages", async () => {
  const { api, calls } = client("https://backend.example", {
    home_team: "Real Madrid", away_team: "RB Leipzig", predicted_score: "5-0",
    xg_home: 4.74, xg_away: 0.44, home_win_prob: 96.6, draw_prob: 2.6, away_win_prob: 0.8,
    poisson_matrix: [[0.0058, 0.0026]],
    form_used: {
      home: { scored_last5: 2.96, conceded_last5: 0.7, is_fallback: false },
      away: { scored_last5: 0.8, conceded_last5: 3.8, is_fallback: false },
    },
    domestic_form: { home: { league_name: "Spain", home_scored: 3.4, home_conceded: 0.6, home_matches: 5 }, away: null },
  });
  const prediction = await api.fetchPrediction("Real Madrid", "RB Leipzig", "ucl", "spain", "germany");
  assert.equal(prediction.predicted_score, "5-0");
  assert.equal(prediction.form.home.scored, 2.96);
  assert.equal(prediction.form.home.conceded, 0.7);
  assert.equal(prediction.domestic_form.home.home_scored, 3.4);
  assert.equal(prediction.domestic_form.away, null);
  assert.equal(prediction.away_win_prob, 0.8);
  assert.equal(calls[0].options.cache, "no-store");
});

test("UCL clubs select their actual domestic leagues", async () => {
  const source = await readFile(new URL("../lib/domesticLeagues.ts", import.meta.url), "utf8");
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, {
    exports,
  });
  for (const [team, league] of [["Como", "italy"], ["RC Lens", "france"], ["LASK", "austria"], ["Sabah", "azerbaijan"], ["Viking FK", "norway"], ["Bodo/Glimt", "norway"]]) {
    assert.equal(exports.getDefaultDomesticLeague(team), league, team);
  }
});
