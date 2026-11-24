// Domestic leagues used by the backend's UCL fixture projection.
// Unknown clubs must be selected manually in the match lab.
const leagues: Record<string, string> = {
  "AEK Athens": "greece", "Bodo/Glimt": "norway", Como: "italy", LASK: "austria", Sabah: "azerbaijan",
  Arsenal: "england", "Aston Villa": "england", "Atletico Madrid": "spain", Barcelona: "spain",
  "Bayern Munich": "germany", "Borussia Dortmund": "germany", "Club Brugge": "belgium",
  Fenerbahce: "turkey", Feyenoord: "netherlands", Galatasaray: "turkey", Inter: "italy",
  "RC Lens": "france", Lille: "france", Liverpool: "england", "Manchester City": "england",
  "Manchester United": "england", Napoli: "italy", "Paris SG": "france", Porto: "portugal",
  "PSV Eindhoven": "netherlands", "RB Leipzig": "germany", "Real Betis": "spain", "Real Madrid": "spain",
  Roma: "italy", "Shakhtar Donetsk": "ukraine", "Slavia Praha": "czech-republic",
  "Slovan Bratislava": "slovakia", "Sporting CP": "portugal", Stuttgart: "germany",
  Villarreal: "spain", "Viking FK": "norway",
};

export function getUclFixtureLeague(team: string): string | undefined {
  return leagues[team];
}
