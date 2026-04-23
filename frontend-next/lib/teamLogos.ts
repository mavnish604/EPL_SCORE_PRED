/**
 * Maps backend team names → logo filenames in /public/.
 * Logos are 128×128 PNGs.
 */
const TEAM_LOGOS: Record<string, string> = {
  "Arsenal": "/arsenal.png",
  "Aston Villa": "/aston_villa.png",
  "Bournemouth": "/bournemouth.png",
  "Brentford": "/brentford.png",
  "Brighton": "/brighton.png",
  "Burnley": "/burnley.png",
  "Chelsea": "/chelsea.png",
  "Crystal Palace": "/crystal_palace.png",
  "Everton": "/everton.png",
  "Fulham": "/fulham.png",
  "Leeds": "/leeds.png",
  "Liverpool": "/liverpool.png",
  "Man City": "/manchester_city.png",
  "Man Utd": "/manchester_united.png",
  "Newcastle": "/newcastle_united.png",
  "Nott'm Forest": "/nottingham_forest.png",
  "Spurs": "/tottenham_spurs.png",
  "Sunderland": "/sunderland.png",
  "West Ham": "/west_ham.png",
  "Wolves": "/wolves.png",
};

export function getTeamLogo(teamName: string): string | undefined {
  return TEAM_LOGOS[teamName];
}
