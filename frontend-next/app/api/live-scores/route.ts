import { NextResponse } from "next/server";
import { fetchLiveScores } from "@/lib/liveScores";
import type { League } from "@/types/prediction";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueParam = (searchParams.get("league") ?? "epl") as League;
  const league = ["epl", "laliga", "ucl"].includes(leagueParam) ? leagueParam : "epl";

  try {
    const scores = await fetchLiveScores(league);
    return NextResponse.json(scores, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch live scores";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
