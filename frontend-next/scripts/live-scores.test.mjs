import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const source = await readFile(new URL("../lib/liveScores.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
vm.runInNewContext(compiled, { exports });
const { normalizeTeamName, matchTeams, findMatchingScore } = exports;

test("normalizeTeamName strips accents and common football suffixes", () => {
  assert.equal(normalizeTeamName("Arsenal FC"), "arsenal");
  assert.equal(normalizeTeamName("Atlético Madrid"), "atleticomadrid");
  assert.equal(normalizeTeamName("Real Madrid CF"), "realmadrid");
  assert.equal(normalizeTeamName("Tottenham Hotspur"), "tottenhamhotspur");
  assert.equal(normalizeTeamName("Man City"), "manchestercity");
});

test("matchTeams accurately matches club variants", () => {
  assert.ok(matchTeams("Arsenal", "Arsenal FC"));
  assert.ok(matchTeams("Manchester City", "Man City"));
  assert.ok(matchTeams("Tottenham Hotspur", "Spurs"));
  assert.ok(matchTeams("Wolverhampton Wanderers", "Wolves"));
});

test("findMatchingScore identifies correct live match from scores array", () => {
  const dummyScores = [
    {
      id: "12345",
      homeTeamName: "Arsenal FC",
      awayTeamName: "Chelsea FC",
      homeScore: 2,
      awayScore: 1,
      state: "in",
      clock: "65'",
      detail: "65'",
      isLive: true,
      isFinished: false,
    },
    {
      id: "67890",
      homeTeamName: "Liverpool",
      awayTeamName: "Manchester City",
      homeScore: 0,
      awayScore: 0,
      state: "pre",
      clock: "",
      detail: "",
      isLive: false,
      isFinished: false,
    },
  ];

  const matched = findMatchingScore(dummyScores, "Arsenal", "Chelsea");
  assert.ok(matched != null);
  assert.equal(matched.homeScore, 2);
  assert.equal(matched.awayScore, 1);
  assert.equal(matched.isLive, true);

  const notFound = findMatchingScore(dummyScores, "Barcelona", "Real Madrid");
  assert.equal(notFound, null);
});
