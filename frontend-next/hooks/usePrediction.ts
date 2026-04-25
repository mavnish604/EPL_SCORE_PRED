"use client";

import { useState, useEffect, useCallback } from "react";
import type { PredictionResult } from "@/types/prediction";
import { fetchTeams, fetchPrediction } from "@/lib/api/predictor";

export type League = "epl" | "laliga";

export function usePrediction() {
  const [league, setLeague] = useState<League>("epl");
  const [teams, setTeams] = useState<string[]>([]);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(true);

  // Load team list on mount or league change
  useEffect(() => {
    setTeamsLoading(true);
    fetchTeams(league)
      .then((list) => {
        setTeams(list);
        if (list.length >= 2) {
          setHomeTeam(list[0]);
          setAwayTeam(list[1]);
        }
      })
      .catch(() => setError("Could not load team list."))
      .finally(() => setTeamsLoading(false));
  }, [league]);

  const predict = useCallback(async () => {
    if (!homeTeam || !awayTeam) return;
    if (homeTeam === awayTeam) {
      setError("Please select two different teams.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchPrediction(homeTeam, awayTeam, league);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Prediction failed.");
    } finally {
      setLoading(false);
    }
  }, [homeTeam, awayTeam, league]);

  return {
    league,
    setLeague,
    teams,
    teamsLoading,
    homeTeam,
    setHomeTeam,
    awayTeam,
    setAwayTeam,
    result,
    loading,
    error,
    predict,
  };
}
