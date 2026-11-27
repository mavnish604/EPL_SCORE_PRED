import type { League } from "@/types/prediction";

export interface LiveMatchScore {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  state: "pre" | "in" | "post";
  clock: string;
  detail: string;
  isLive: boolean;
  isFinished: boolean;
}

const LEAGUE_ESPN_MAP: Record<League, string> = {
  epl: "eng.1",
  laliga: "esp.1",
  ucl: "uefa.champions",
};

const ALIASES: Record<string, string> = {
  mancity: "manchestercity",
  manutd: "manchesterunited",
  spurs: "tottenhamhotspur",
  wolves: "wolverhamptonwanderers",
  brighton: "brightonhovealbion",
  newcastle: "newcastleunited",
  westham: "westhamunited",
  atletico: "atleticomadrid",
  athletic: "athleticclub",
  barca: "barcelona",
  psg: "parissaintgermain",
  inter: "internazionale",
  bayern: "bayernmunich",
  dortmund: "borussiadortmund",
  leverkusen: "bayerleverkusen",
  sporting: "sportingcp",
  benfica: "slbenfica",
};

export function normalizeTeamName(name: string): string {
  if (!name) return "";
  const cleaned = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(fc|cf|afc|club|de|the|and)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
  return ALIASES[cleaned] || cleaned;
}

export function matchTeams(a: string, b: string): boolean {
  const normA = normalizeTeamName(a);
  const normB = normalizeTeamName(b);
  if (!normA || !normB) return false;
  return normA === normB || normA.includes(normB) || normB.includes(normA);
}

interface ESPNCompetitor {
  homeAway: "home" | "away";
  team?: {
    displayName?: string;
    shortDisplayName?: string;
    name?: string;
  };
  score?: string;
}

interface ESPNEvent {
  id: string;
  status?: {
    type?: {
      state?: "pre" | "in" | "post";
      completed?: boolean;
      detail?: string;
      shortDetail?: string;
      description?: string;
    };
    displayClock?: string;
  };
  competitions?: {
    competitors?: ESPNCompetitor[];
  }[];
}

interface ESPNScoreboardResponse {
  events?: ESPNEvent[];
}

export async function fetchLiveScores(league: League, signal?: AbortSignal): Promise<LiveMatchScore[]> {
  const espnLeague = LEAGUE_ESPN_MAP[league] ?? "eng.1";
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${espnLeague}/scoreboard`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const abortHandler = () => controller.abort();
    signal?.addEventListener("abort", abortHandler);

    const res = await fetch(url, { signal: controller.signal, cache: "no-store" }).finally(() => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abortHandler);
    });

    if (!res.ok) return [];

    const data = (await res.json()) as ESPNScoreboardResponse;
    const events = data.events ?? [];
    const results: LiveMatchScore[] = [];

    for (const event of events) {
      const comp = event.competitions?.[0];
      if (!comp?.competitors || comp.competitors.length < 2) continue;

      const homeComp = comp.competitors.find((c) => c.homeAway === "home");
      const awayComp = comp.competitors.find((c) => c.homeAway === "away");
      if (!homeComp || !awayComp) continue;

      const homeName = homeComp.team?.displayName ?? homeComp.team?.name ?? "";
      const awayName = awayComp.team?.displayName ?? awayComp.team?.name ?? "";
      const homeScore = parseInt(homeComp.score ?? "0", 10);
      const awayScore = parseInt(awayComp.score ?? "0", 10);

      const state = event.status?.type?.state ?? "pre";
      const displayClock = event.status?.displayClock ?? "";
      const detail = event.status?.type?.shortDetail ?? event.status?.type?.detail ?? "";

      const isLive = state === "in";
      const isFinished = state === "post" || Boolean(event.status?.type?.completed);
      const formattedClock = displayClock
        ? displayClock.endsWith("'")
          ? displayClock
          : `${displayClock}'`
        : "";
      const clock = isFinished
        ? detail || "FT"
        : formattedClock || detail || (isLive ? "LIVE" : "");

      results.push({
        id: event.id,
        homeTeamName: homeName,
        awayTeamName: awayName,
        homeScore: isNaN(homeScore) ? 0 : homeScore,
        awayScore: isNaN(awayScore) ? 0 : awayScore,
        state,
        clock,
        detail,
        isLive,
        isFinished,
      });
    }

    return results;
  } catch {
    return [];
  }
}

export function findMatchingScore(
  scores: LiveMatchScore[],
  homeTeam: string,
  awayTeam: string
): LiveMatchScore | null {
  if (!Array.isArray(scores) || scores.length === 0) return null;
  for (const score of scores) {
    if (matchTeams(score.homeTeamName, homeTeam) && matchTeams(score.awayTeamName, awayTeam)) {
      return score;
    }
  }
  return null;
}
