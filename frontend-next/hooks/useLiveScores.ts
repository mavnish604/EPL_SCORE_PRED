"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchLiveScores, findMatchingScore, type LiveMatchScore } from "@/lib/liveScores";
import type { League } from "@/types/prediction";

export function useLiveScores(league: League) {
  const [scores, setScores] = useState<LiveMatchScore[]>([]);
  const isFetchingRef = useRef(false);

  const loadScores = useCallback(async (signal?: AbortSignal) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const data = await fetchLiveScores(league, signal);
      if (Array.isArray(data)) {
        setScores(data);
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
