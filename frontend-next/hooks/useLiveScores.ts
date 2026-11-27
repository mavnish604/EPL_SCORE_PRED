"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { fetchLiveScores, findMatchingScore, type LiveMatchScore } from "@/lib/liveScores";
import type { League } from "@/types/prediction";

export function useLiveScores(league: League) {
  const [state, setState] = useState<{ league: League; scores: LiveMatchScore[] }>({
    league,
    scores: [],
  });
  const isFetchingRef = useRef(false);

  const loadScores = useCallback(async (signal?: AbortSignal) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      let data: LiveMatchScore[] = [];
      try {
        const res = await fetch(`/api/live-scores?league=${encodeURIComponent(league)}`, {
          cache: "no-store",
          signal,
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) data = json;
        } else {
          data = await fetchLiveScores(league, signal);
        }
      } catch {
        if (!signal?.aborted) {
          data = await fetchLiveScores(league, signal);
        }
      }

      if (!signal?.aborted && Array.isArray(data)) {
        setState({ league, scores: data });
      }
    } catch {
      // ignore
    } finally {
      isFetchingRef.current = false;
    }
  }, [league]);

  useEffect(() => {
    const controller = new AbortController();
    loadScores(controller.signal);

    // Poll every 60 seconds smoothly
    const interval = setInterval(() => {
      loadScores();
    }, 60_000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [league, loadScores]);

  const scores = useMemo(
    () => (state.league === league ? state.scores : []),
    [state.league, state.scores, league]
  );

  const findScore = useCallback(
    (homeTeam: string, awayTeam: string): LiveMatchScore | null => {
      if (!scores || scores.length === 0) return null;
      return findMatchingScore(scores, homeTeam, awayTeam);
    },
    [scores]
  );

  return {
    scores,
    findScore,
    refresh: () => loadScores(),
  };
}
