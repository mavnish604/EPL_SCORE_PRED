import type { PredictionResult } from "@/types/prediction";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchTeams(league: "epl" | "laliga" = "epl"): Promise<string[]> {
  return fetchJson<string[]>(`${API_BASE}/${league}/teams`);
}

export async function fetchPrediction(
  home_team: string,
  away_team: string,
  league: "epl" | "laliga" = "epl"
): Promise<PredictionResult> {
  return fetchJson<PredictionResult>(`${API_BASE}/${league}/predict`, {
    method: "POST",
    body: JSON.stringify({ home_team, away_team }),
  });
}
