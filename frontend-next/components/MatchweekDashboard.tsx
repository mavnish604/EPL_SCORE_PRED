"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, CalendarDays, ChevronDown, ChevronUp, Minus, RefreshCw, RotateCcw, Search, Trophy, X } from "lucide-react";
import TeamCrest from "@/components/TeamCrest";
import { useLiveScores } from "@/hooks/useLiveScores";
import { calculateClinchStatus, calculateMatchInsights, simulateStandings } from "@/lib/analytics";
import { fetchFixtures, fetchPrediction, fetchStandings, type LiveFixture, type WithFallbackMeta } from "@/lib/api/predictor";
import type { LiveMatchScore } from "@/lib/liveScores";
import { competitions } from "@/lib/competitions";
import { getUclFixtureLeague } from "@/lib/uclFixtureLeagues";
import type { League, PredictionResult } from "@/types/prediction";
import type { Standing } from "@/types/standings";

type View = "fixtures" | "current" | "predicted" | "whatif";
type Resource<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  source?: string | null;
  snapshotAt?: string | null;
};
const pending = <T,>(): Resource<T> => ({ data: null, error: null, loading: true, source: null, snapshotAt: null });
const columns = [["played", "P", "Played"], ["won", "W", "Won"], ["drawn", "D", "Drawn"], ["lost", "L", "Lost"], ["goals_for", "GF", "Goals for"], ["goals_against", "GA", "Goals against"], ["goal_difference", "GD", "Goal difference"], ["points", "Pts", "Points"]] as const;

function FixtureCard({
  match,
  index,
  league,
  homeRank,
  awayRank,
  liveScore,
  onOpenLab,
  simulatedOutcome,
  onSimulate,
}: {
  match: LiveFixture;
  index: number;
  league: League;
  homeRank?: number;
  awayRank?: number;
  liveScore?: LiveMatchScore | null;
  onOpenLab?: (home?: string, away?: string) => void;
  simulatedOutcome?: "home" | "draw" | "away";
  onSimulate?: (outcome?: "home" | "draw" | "away") => void;
}) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const homeLeague = league === "ucl" ? getUclFixtureLeague(match.home_teams) : undefined;
    const awayLeague = league === "ucl" ? getUclFixtureLeague(match.away_teams) : undefined;
    if (league === "ucl" && (!homeLeague || !awayLeague)) {
      Promise.resolve().then(() => {
        if (!controller.signal.aborted) {
          setError("Choose the clubs’ domestic leagues in the match lab to predict this fixture.");
          setLoading(false);
        }
      });
    } else {
      fetchPrediction(match.home_teams, match.away_teams, league, homeLeague, awayLeague, controller.signal)
        .then((result) => { if (!controller.signal.aborted) setPrediction(result); })
        .catch((err: unknown) => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not predict this fixture."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }
    return () => controller.abort();
  }, [league, match.home_teams, match.away_teams, attempt]);

  const homeProb = prediction?.home_win_prob ?? 0;
  const drawProb = prediction?.draw_prob ?? 0;
  const awayProb = prediction?.away_win_prob ?? 0;
  const maxProb = Math.max(homeProb, drawProb, awayProb);

  const insights = useMemo(() => {
    if (!prediction) return null;
    return calculateMatchInsights(prediction, match.home_team_name, match.away_team_name, homeRank, awayRank);
  }, [prediction, match.home_team_name, match.away_team_name, homeRank, awayRank]);

  return (
    <article className="match-card group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-sm">
      <div>
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {liveScore?.isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
              LIVE {liveScore.clock}
            </span>
          ) : liveScore?.isFinished ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/70 px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
              FT · Full Time
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="h-3 w-3" />
              {match.kickoff_time && !Number.isNaN(Date.parse(match.kickoff_time))
                ? new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(match.kickoff_time)) + " UTC"
                : `Fixture ${String(index + 1).padStart(2, "0")}`}
            </span>
          )}
          {insights?.isUpsetAlert ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
              🚨 Upset Alert
            </span>
          ) : (
            <span className="font-semibold text-primary">Win Probability</span>
          )}
        </div>

        {/* Team Matchup with Crests */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-6 pb-4">
          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <div className="crest-plinth flex h-16 w-16 items-center justify-center rounded-full border border-border/40 shadow-2xs sm:h-18 sm:w-18">
              <TeamCrest team={match.home_team_name} className="h-10 w-10 sm:h-11 sm:w-11" />
            </div>
            <div className="flex flex-col items-center">
              <p className="line-clamp-2 max-w-[130px] text-xs font-semibold leading-snug sm:text-sm">{match.home_team_name}</p>
              {homeRank != null && <span className="text-[10px] text-muted-foreground font-semibold">#{homeRank}</span>}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            {liveScore && (liveScore.isLive || liveScore.isFinished) ? (
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-1.5 text-2xl sm:text-3xl font-black tabular-nums tracking-tight">
                  <span className={liveScore.isLive ? "text-red-600 dark:text-red-400" : "text-foreground"}>
                    {liveScore.homeScore}
                  </span>
                  <span className="text-muted-foreground/40 text-lg">–</span>
                  <span className={liveScore.isLive ? "text-red-600 dark:text-red-400" : "text-foreground"}>
                    {liveScore.awayScore}
                  </span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                  liveScore.isLive ? "text-red-500 animate-pulse" : "text-muted-foreground"
                }`}>
                  {liveScore.isLive ? liveScore.clock : "Final"}
                </span>
              </div>
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-muted/60 text-[10px] font-bold tracking-wider text-muted-foreground shadow-2xs">
                VS
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <div className="crest-plinth flex h-16 w-16 items-center justify-center rounded-full border border-border/40 shadow-2xs sm:h-18 sm:w-18">
              <TeamCrest team={match.away_team_name} className="h-10 w-10 sm:h-11 sm:w-11" />
            </div>
            <div className="flex flex-col items-center">
              <p className="line-clamp-2 max-w-[130px] text-xs font-semibold leading-snug sm:text-sm">{match.away_team_name}</p>
              {awayRank != null && <span className="text-[10px] text-muted-foreground font-semibold">#{awayRank}</span>}
            </div>
          </div>
        </div>

        {/* Win Probability Bar and Badges */}
        <div className="px-4 pb-4">
          {prediction ? (
            <div className="rounded-xl border border-border/70 bg-muted/25 p-3">
              {/* Segmented Probability Bar */}
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/70 p-0.5 gap-0.5">
                <div
                  className="rounded-l-full bg-primary transition-all duration-500"
                  style={{ width: `${homeProb}%` }}
                  title={`Home win: ${homeProb}%`}
                />
                <div
                  className="bg-muted-foreground/35 transition-all duration-500"
                  style={{ width: `${drawProb}%` }}
                  title={`Draw: ${drawProb}%`}
                />
                <div
                  className="rounded-r-full bg-chart-1 transition-all duration-500"
                  style={{ width: `${awayProb}%` }}
                  title={`Away win: ${awayProb}%`}
                />
              </div>

              {/* Outcome Badges */}
              <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
                <div className={`rounded-lg py-1.5 px-1 border transition-all ${homeProb === maxProb ? "border-primary/40 bg-primary/10" : "border-border/40 bg-background/50"}`}>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Home</p>
                  <p className={`text-sm font-bold tabular-nums ${homeProb === maxProb ? "text-primary font-extrabold" : "text-foreground"}`}>{homeProb}%</p>
                </div>
                <div className={`rounded-lg py-1.5 px-1 border transition-all ${drawProb === maxProb ? "border-border/80 bg-muted/80" : "border-border/40 bg-background/50"}`}>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Draw</p>
                  <p className={`text-sm font-bold tabular-nums ${drawProb === maxProb ? "text-foreground font-extrabold" : "text-muted-foreground"}`}>{drawProb}%</p>
                </div>
                <div className={`rounded-lg py-1.5 px-1 border transition-all ${awayProb === maxProb ? "border-chart-1/40 bg-chart-1/10" : "border-border/40 bg-background/50"}`}>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Away</p>
                  <p className={`text-sm font-bold tabular-nums ${awayProb === maxProb ? "text-chart-1 font-extrabold" : "text-foreground"}`}>{awayProb}%</p>
                </div>
              </div>

              {/* Dynamic AI Match Narrative */}
              {insights?.verdict && (
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/90 italic border-t border-border/40 pt-2.5">
                  &ldquo;{insights.verdict}&rdquo;
                </p>
              )}

              {/* Goal & FPL Insights Toggle */}
              {insights && (
                <div className="mt-2 pt-2 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setShowInsights(!showInsights)}
                    className="flex w-full items-center justify-between text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>FPL & Match Stats</span>
                    <span>{showInsights ? "▲ Less" : "▼ More"}</span>
                  </button>

                  {showInsights && (
                    <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px] tabular-nums">
                      <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Clean Sheet</span>
                        <div className="mt-0.5 flex justify-between font-bold">
                          <span>Home: {insights.homeCleanSheet}%</span>
                          <span>Away: {insights.awayCleanSheet}%</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Over 2.5 Goals</span>
                        <span className="mt-0.5 block font-bold text-foreground">{insights.over25Prob}%</span>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Both Teams Score</span>
                        <span className="mt-0.5 block font-bold text-foreground">{insights.bttsProb}%</span>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-background/60 p-2">
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Expected Points</span>
                        <div className="mt-0.5 flex justify-between font-bold">
                          <span>H: {insights.homeXpts}</span>
                          <span>A: {insights.awayXpts}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Interactive What-If Toggle Controls */}
              {onSimulate && (
                <div className="mt-3 rounded-xl border border-border/60 bg-background/60 p-2">
                  <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                    <span className="uppercase tracking-wider font-semibold">What-If:</span>
                    {simulatedOutcome && (
                      <span className="text-[9px] text-primary font-bold">Pick active</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(["home", "draw", "away"] as const).map((outcome) => {
                      const isSelected = simulatedOutcome === outcome;
                      const label = outcome === "home" ? "Home Win" : outcome === "draw" ? "Draw" : "Away Win";
                      return (
                        <button
                          key={outcome}
                          type="button"
                          onClick={() => onSimulate(isSelected ? undefined : outcome)}
                          className={`rounded-lg py-1.5 px-1 text-[10px] font-bold text-center transition-all ${
                            isSelected
                              ? outcome === "home"
                                ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary/60"
                                : outcome === "draw"
                                ? "bg-foreground text-background shadow-xs ring-1 ring-foreground/60"
                                : "bg-chart-1 text-white shadow-xs ring-1 ring-chart-1/60"
                              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3 animate-pulse">
              <div className="h-2.5 w-full rounded-full bg-muted/60" />
              <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                <div className="h-11 rounded-lg bg-muted/40" />
                <div className="h-11 rounded-lg bg-muted/40" />
                <div className="h-11 rounded-lg bg-muted/40" />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              Prediction unavailable
            </div>
          )}
        </div>

        {prediction && (prediction.form.home.is_fallback || prediction.form.away.is_fallback) && (
          <p className="px-4 pb-3 text-center text-[10px] text-muted-foreground">Limited form data; this prediction uses fallback values.</p>
        )}
        {error && (
          <div role="alert" className="px-4 pb-4 text-center text-xs text-destructive">
            {error} <button type="button" onClick={() => { setError(null); setLoading(true); setAttempt((value) => value + 1); }} className="font-semibold underline">Retry</button>
          </div>
        )}
      </div>
      <div>
        {onOpenLab && (
          <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-4 py-2.5">
            <span className="text-[10px] text-muted-foreground">Detailed simulation</span>
            <button type="button" onClick={() => onOpenLab(match.home_teams, match.away_teams)} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary transition-colors hover:text-primary/80">
              Analyze in Lab <ArrowRight aria-hidden="true" className="h-3 w-3" />
            </button>
          </div>
        )}
        <div aria-hidden="true" className="h-0.5 bg-gradient-to-r from-primary/60 via-primary/10 to-transparent" />
      </div>
    </article>
  );
}

function WhatIfTablePopup({
  standings,
  currentRanks,
  simulationsCount,
  onReset,
  onClose,
  onFullView,
}: {
  standings: Standing[];
  currentRanks: Map<string, number>;
  simulationsCount: number;
  onReset: () => void;
  onClose: () => void;
  onFullView: () => void;
}) {
  const moversCount = standings.filter(
    (row) => currentRanks.has(row.team) && currentRanks.get(row.team)! !== row.rank
  ).length;

  return (
    <aside
      aria-label="Live Simulated Standings"
      className="fixed bottom-5 right-5 z-50 flex w-[350px] sm:w-[390px] max-h-[80vh] flex-col rounded-2xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold leading-tight">Live What-If Table</h3>
              <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[9px] font-extrabold text-primary">
                {simulationsCount} {simulationsCount === 1 ? "pick" : "picks"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {moversCount > 0 ? `${moversCount} club positions shifted` : "No table movement yet"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            title="Reset simulations"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Minimize pop-up"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-y-auto overflow-x-hidden p-2 text-xs">
        <table className="w-full tabular-nums">
          <thead>
            <tr className="border-b border-border/40 text-[9px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="pb-2 text-center w-8">#</th>
              <th scope="col" className="pb-2 text-left pl-2">Club</th>
              <th scope="col" className="pb-2 text-center w-12">Pts</th>
              <th scope="col" className="pb-2 text-center w-12">Shift</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => {
              const previous = currentRanks.get(row.team);
              const change = previous == null ? null : previous - row.rank;
              const hasMoved = change != null && change !== 0;

              return (
                <tr
                  key={row.team}
                  className={`border-b border-border/30 last:border-0 transition-colors ${
                    hasMoved ? "bg-primary/5 font-semibold" : "hover:bg-muted/30"
                  }`}
                >
                  <td className="py-2 text-center text-[11px] text-muted-foreground">
                    {row.rank}
                  </td>
                  <td className="py-2 pl-2">
                    <span className="flex items-center gap-2">
                      <TeamCrest team={row.team} className="h-4 w-4 shrink-0" />
                      <span className="truncate max-w-[170px] text-[11px]">{row.team}</span>
                    </span>
                  </td>
                  <td className="py-2 text-center font-bold text-[11px] text-foreground">
                    {row.points}
                  </td>
                  <td className="py-2 text-center">
                    <span
                      className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-bold ${
                        change && change > 0
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : change && change < 0
                          ? "bg-red-500/15 text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {change == null || change === 0 ? (
                        <Minus className="h-2.5 w-2.5" />
                      ) : change > 0 ? (
                        <>
                          <ArrowUp className="h-2.5 w-2.5" />
                          {change}
                        </>
                      ) : (
                        <>
                          <ArrowDown className="h-2.5 w-2.5" />
                          {Math.abs(change)}
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/70 bg-muted/20 px-3 py-2 text-[11px]">
        <span className="text-[10px] text-muted-foreground">Pick 1, X, 2 to simulate</span>
        <button
          type="button"
          onClick={onFullView}
          className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Full table view <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </aside>
  );
}

export default function MatchweekDashboard({ league, onOpenLab }: { league: League; onOpenLab?: (home?: string, away?: string) => void }) {
  const [view, setView] = useState<View>("fixtures");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [revision, setRevision] = useState(0);
  const [current, setCurrent] = useState<Resource<Standing[]>>(pending);
  const [predicted, setPredicted] = useState<Resource<Standing[]>>(pending);
  const [fixtures, setFixtures] = useState<Resource<LiveFixture[]>>(pending);
  const [simulations, setSimulations] = useState<Map<number, "home" | "draw" | "away">>(new Map());
  const [showPopup, setShowPopup] = useState(false);
  const { findScore } = useLiveScores(league);

  useEffect(() => {
    const controller = new AbortController();
    const load = <T,>(request: Promise<WithFallbackMeta<T>>, set: (value: Resource<T>) => void) => {
      request
        .then((data) => {
          if (!controller.signal.aborted) {
            set({
              data,
              error: null,
              loading: false,
              source: data.source ?? null,
              snapshotAt: data.snapshotAt ?? null,
            });
          }
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            set({ data: null, error: error instanceof Error ? error.message : "Please try again.", loading: false, source: null, snapshotAt: null });
          }
        });
    };
    load(fetchStandings(league, false, controller.signal), setCurrent);
    load(fetchStandings(league, true, controller.signal), setPredicted);
    load(fetchFixtures(league, controller.signal), setFixtures);
    return () => controller.abort();
  }, [league, revision]);

  const refresh = () => {
    setCurrent(pending()); setPredicted(pending()); setFixtures(pending());
    setSimulations(new Map());
    setShowPopup(false);
    setRevision((value) => value + 1);
  };

  const handleSimulate = (matchIndex: number, outcome?: "home" | "draw" | "away") => {
    setSimulations((prev) => {
      const next = new Map(prev);
      if (!outcome) {
        next.delete(matchIndex);
      } else {
        next.set(matchIndex, outcome);
      }
      return next;
    });
    if (outcome) {
      setShowPopup(true);
    }
  };

  const currentRanks = useMemo(
    () => new Map((current.data ?? []).map((row) => [row.team, row.rank])),
    [current.data]
  );

  // Compute live What-If simulated standings
  const whatIfStandings = useMemo(() => {
    if (!current.data || !fixtures.data || simulations.size === 0) return current.data ?? [];
    const simulatedList = Array.from(simulations.entries()).map(([idx, outcome]) => {
      const fix = fixtures.data?.[idx];
      return {
        homeTeam: fix?.home_team_name ?? "",
        awayTeam: fix?.away_team_name ?? "",
        outcome,
      };
    }).filter((s) => s.homeTeam && s.awayTeam);
    return simulateStandings(current.data, simulatedList);
  }, [current.data, fixtures.data, simulations]);

  const resource = view === "fixtures" ? fixtures : view === "current" ? current : view === "predicted" ? predicted : { data: whatIfStandings, error: null, loading: current.loading };
  const query = search.trim().toLowerCase();

  const activeStandings = useMemo(() => {
    return view === "whatif" ? whatIfStandings : view === "predicted" ? predicted.data : current.data;
  }, [view, whatIfStandings, predicted.data, current.data]);

  const rows = useMemo(() => {
    return (activeStandings ?? []).filter((row) => row.team.toLowerCase().includes(query));
  }, [activeStandings, query]);

  const matches = useMemo(() => {
    return fixtures.data?.filter((fixture) => `${fixture.home_team_name} ${fixture.away_team_name}`.toLowerCase().includes(query)) ?? [];
  }, [fixtures.data, query]);

  const visible = expanded || query ? matches : matches.slice(0, 6);
  const movers = predicted.data?.filter((row) => currentRanks.has(row.team) && currentRanks.get(row.team)! > row.rank).length;
  const leader = whatIfStandings[0] ?? predicted.data?.[0] ?? current.data?.[0];
  const gameweeks = new Set((fixtures.data ?? []).map((fixture) => fixture.gameweek).filter((week) => week != null));
  const gameweek = gameweeks.size === 1 ? fixtures.data?.[0]?.gameweek : undefined;

  // Mathematical Clinch & Safety Markers (computed on full league standings)
  const clinchMap = useMemo(() => calculateClinchStatus(activeStandings ?? [], league), [activeStandings, league]);

  return (
    <section aria-labelledby="matchweek-title" className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Remaining fixtures", value: fixtures.data ? String(fixtures.data.length).padStart(2, "0") : "–", detail: "in this window", icon: CalendarDays },
          { label: "Climbing the table", value: current.data && predicted.data ? String(movers).padStart(2, "0") : "–", detail: "compared with current standings", icon: ArrowUp },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 px-5 py-4">
            <stat.icon aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tracking-tight tabular-nums">{stat.value}</span>
                <span className="text-[11px] text-muted-foreground">{stat.detail}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{competitions[league].name}{gameweek != null && ` · Gameweek ${gameweek}`}</p>
          <h2 id="matchweek-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">The matchweek, mapped.</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            {fixtures.loading ? "Loading fixtures…" : fixtures.data ? `${fixtures.data.length} upcoming fixtures in this window.` : "Fixtures are currently unavailable."}
          </p>
        </div>
        <button type="button" onClick={refresh} className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground">
          <RefreshCw aria-hidden="true" className="h-3 w-3" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div role="group" aria-label="Matchweek view" className="flex w-full min-w-0 flex-wrap rounded-xl bg-muted/70 p-1 sm:w-auto">
          {([
            ["fixtures", "Fixtures"],
            ["current", "Current standings"],
            ["predicted", "Predicted standings"],
            ["whatif", `What-If Simulator ${simulations.size > 0 ? `(${simulations.size})` : ""}`],
          ] as const).map(([key, label]) => (
            <button
              type="button"
              key={key}
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={`min-w-0 flex-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-colors sm:flex-none sm:px-3.5 sm:text-xs ${
                view === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:w-52">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <span className="sr-only">Search clubs</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a club…"
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      {resource.source === "database-fallback" && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Using saved database backup:</strong> Live provider is unreachable. Serving saved snapshot
              {resource.snapshotAt && !Number.isNaN(Date.parse(resource.snapshotAt))
                ? ` from ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(resource.snapshotAt))} UTC`
                : ""}
              .
            </span>
          </div>
          <span className="hidden sm:inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Offline Fallback
          </span>
        </div>
      )}

      {resource.loading ? (
        <p role="status" className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading {view === "fixtures" ? "fixtures" : "standings"}…
        </p>
      ) : resource.error ? (
        <div role="alert" className="rounded-2xl border border-border bg-card p-8">
          <p className="font-semibold">Couldn’t load {view === "fixtures" ? "fixtures" : "standings"}.</p>
          <p className="mt-2 text-sm text-muted-foreground">{resource.error}</p>
          <button type="button" onClick={refresh} className="mt-4 text-sm font-semibold text-primary">Try again</button>
        </div>
      ) : view === "fixtures" ? (
        <>
          {visible.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((match, index) => (
                <FixtureCard
                  key={`${match.home_teams}-${match.away_teams}-${index}`}
                  match={match}
                  index={index}
                  league={league}
                  homeRank={currentRanks.get(match.home_team_name)}
                  awayRank={currentRanks.get(match.away_team_name)}
                  liveScore={findScore(match.home_team_name, match.away_team_name)}
                  onOpenLab={onOpenLab}
                  simulatedOutcome={simulations.get(index)}
                  onSimulate={(outcome) => handleSimulate(index, outcome)}
                />
              ))}
            </div>
          ) : (
            <p role="status" className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              {query ? "No matches for that club." : "No upcoming fixtures in this window."}
            </p>
          )}
          {!query && matches.length > 6 && (
            <div className="text-center">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-xs font-semibold hover:bg-card"
              >
                {expanded ? "Show fewer matches" : `View all ${matches.length} matches`}
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}

          {/* Live What-If Pop-Up Table next to predictions */}
          {simulations.size > 0 && showPopup && (
            <WhatIfTablePopup
              standings={whatIfStandings}
              currentRanks={currentRanks}
              simulationsCount={simulations.size}
              onReset={() => setSimulations(new Map())}
              onClose={() => setShowPopup(false)}
              onFullView={() => setView("whatif")}
            />
          )}

          {/* Floating toggle pill when minimized */}
          {simulations.size > 0 && !showPopup && (
            <button
              type="button"
              onClick={() => setShowPopup(true)}
              className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/95 px-4 py-2.5 text-xs font-bold text-foreground shadow-2xl backdrop-blur-md hover:border-primary/50 hover:shadow-primary/10 transition-all animate-in fade-in"
            >
              <Trophy className="h-4 w-4 text-primary" />
              <span>What-If Table ({simulations.size})</span>
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </>
      ) : view === "whatif" ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 px-5 py-4">
            <div>
              <p className="font-semibold text-sm">Interactive What-If Simulation</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toggle outcomes (1 = Home, X = Draw, 2 = Away) on the fixtures to immediately see how the table shifts.
              </p>
            </div>
            {simulations.size > 0 && (
              <button
                type="button"
                onClick={() => setSimulations(new Map())}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" /> Reset ({simulations.size})
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[720px] text-sm tabular-nums">
              <caption className="sr-only">Simulated {competitions[league].name} standings</caption>
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="px-4 py-4 text-center">#</th>
                  <th scope="col" className="sticky left-0 z-10 bg-card px-4 py-4 text-left">Club</th>
                  <th scope="col" className="px-3 py-4 text-center">Shift</th>
                  {columns.map(([key, label, full]) => (
                    <th scope="col" key={key} className="px-3 py-4 text-center">
                      <abbr title={full} className="no-underline">{label}</abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const previous = currentRanks.get(row.team);
                  const change = previous == null ? null : previous - row.rank;
                  const clinch = clinchMap.get(row.team);
                  return (
                    <tr key={row.team} className="group border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3.5 text-center text-xs text-muted-foreground">
                        {String(row.rank).padStart(2, "0")}
                      </td>
                      <th scope="row" className="sticky left-0 z-10 bg-card px-4 py-3.5 text-left group-hover:bg-muted">
                        <span className="flex items-center gap-3 whitespace-nowrap text-xs font-semibold">
                          <TeamCrest team={row.team} className="h-6 w-6" />
                          {row.team}
                          {clinch && (
                            <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${clinch.badgeClass}`}>
                              {clinch.label}
                            </span>
                          )}
                        </span>
                      </th>
                      <td className="px-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          change && change > 0 ? "text-emerald-700 dark:text-emerald-400" : change && change < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                        }`}>
                          {change == null ? "–" : change > 0 ? <ArrowUp aria-label="Up" className="h-3 w-3" /> : change < 0 ? <ArrowDown aria-label="Down" className="h-3 w-3" /> : <Minus aria-label="Unchanged" className="h-3 w-3" />}
                          {change != null && change !== 0 && Math.abs(change)}
                        </span>
                      </td>
                      {columns.map(([key]) => (
                        <td key={key} className={`px-3 py-3.5 text-center text-xs ${key === "points" ? "bg-primary/5 font-bold text-foreground" : "text-muted-foreground"}`}>
                          {key === "goal_difference" && row[key] > 0 ? "+" : ""}{row[key]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div role="region" aria-label={`${view} ${competitions[league].name} standings. Scroll horizontally for all columns.`} tabIndex={0} className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm tabular-nums">
            <caption className="sr-only">{view === "current" ? "Current standings" : "Predicted standings"} · {competitions[league].name}</caption>
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-4 py-4 text-center">#</th>
                <th scope="col" className="sticky left-0 z-10 bg-card px-4 py-4 text-left">Club</th>
                {view === "predicted" && <th scope="col" className="px-3 py-4 text-center">Move</th>}
                {columns.map(([key, label, full]) => (
                  <th scope="col" key={key} className="px-3 py-4 text-center">
                    <abbr title={full} className="no-underline">{label}</abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const previous = currentRanks.get(row.team);
                const change = previous == null ? null : previous - row.rank;
                const clinch = clinchMap.get(row.team);
                return (
                  <tr key={row.team} className="group border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3.5 text-center text-xs text-muted-foreground">
                      {String(row.rank).padStart(2, "0")}
                    </td>
                    <th scope="row" className="sticky left-0 z-10 bg-card px-4 py-3.5 text-left group-hover:bg-muted">
                      <span className="flex items-center gap-3 whitespace-nowrap text-xs font-semibold">
                        <TeamCrest team={row.team} className="h-6 w-6" />
                        {row.team}
                        {clinch && (
                          <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${clinch.badgeClass}`}>
                            {clinch.label}
                          </span>
                        )}
                      </span>
                    </th>
                    {view === "predicted" && (
                      <td className="px-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] ${
                          change && change > 0 ? "text-emerald-700 dark:text-emerald-400" : change && change < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                        }`}>
                          {change == null ? "–" : change > 0 ? <ArrowUp aria-label="Up" className="h-3 w-3" /> : change < 0 ? <ArrowDown aria-label="Down" className="h-3 w-3" /> : <Minus aria-label="Unchanged" className="h-3 w-3" />}
                          {change != null && change !== 0 && Math.abs(change)}
                        </span>
                      </td>
                    )}
                    {columns.map(([key]) => (
                      <td key={key} className={`px-3 py-3.5 text-center text-xs ${key === "points" ? "bg-primary/5 font-bold text-foreground" : "text-muted-foreground"}`}>
                        {key === "goal_difference" && row[key] > 0 ? "+" : ""}{row[key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && (
            <p role="status" className="p-10 text-center text-sm text-muted-foreground">
              {query ? "No clubs found." : "No standings available."}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <p className="max-w-lg text-[11px] leading-relaxed text-muted-foreground">
          {view === "fixtures"
            ? "Fixture predictions are calculated live with Poisson goal distributions. Use What-If buttons to test custom matchweek scenarios."
            : view === "whatif"
            ? "Simulated standings based on your selected match outcomes. Reset anytime to return to current table."
            : view === "predicted"
            ? "Latest saved projection, compared with current standings. The snapshot time is not available."
            : "Current standings from the provider with mathematical safety and clinch indicators."}
        </p>
        <button onClick={() => onOpenLab?.()} className="flex items-center gap-2 text-xs font-semibold text-primary">
          Build your own matchup <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>

      {leader && (
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-border bg-card/60 px-6 py-5">
          <div className="flex items-center gap-4">
            <TeamCrest team={leader.team} className="h-11 w-11" />
            <div>
              <p className="eyebrow mb-1">
                {view === "whatif" && simulations.size > 0 ? "Simulated Leader" : predicted.data?.length ? "Projected leader" : "Current leader"}
              </p>
              <p className="text-base font-semibold">{leader.team}</p>
            </div>
          </div>
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight">{leader.points}</span>
            <span className="text-xs text-muted-foreground">points</span>
          </p>
        </div>
      )}
    </section>
  );
}
