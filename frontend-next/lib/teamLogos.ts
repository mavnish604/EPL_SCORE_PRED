/**
 * Maps backend team names → logo filenames in /public/.
 * Supports both Premier League (EPL) and La Liga teams, with accent-insensitive fallback.
 */

const TEAM_LOGOS: Record<string, string> = {
  // --- Premier League ---
  "Arsenal": "/arsenal.png",
  "Aston Villa": "/aston_villa.png",
  "Bournemouth": "/bournemouth.png",
  "Brentford": "/brentford.png",
  "Brighton": "/brighton.png",
  "Burnley": "/burnley.png",
  "Chelsea": "/chelsea.png",
  "Coventry City": "/coventry_city.png",
  "Crystal Palace": "/crystal_palace.png",
  "Everton": "/everton.png",
  "Fulham": "/fulham.png",
  "Hull City": "/hull_city.png",
  "Ipswich Town": "/ipswich_town.png",
  "Leeds": "/leeds.png",
  "Liverpool": "/liverpool.png",
  "Man City": "/manchester_city.png",
  "Man Utd": "/manchester_united.png",
  "Manchester City": "/manchester_city.png",
  "Manchester United": "/manchester_united.png",
  "Newcastle": "/newcastle_united.png",
  "Newcastle United": "/newcastle_united.png",
  "Nott'm Forest": "/nottingham_forest.png",
  "Nottingham Forest": "/nottingham_forest.png",
  "Spurs": "/tottenham_spurs.png",
  "Tottenham": "/tottenham_spurs.png",
  "Tottenham Hotspur": "/tottenham_spurs.png",
  "Sunderland": "/sunderland.png",
  "West Ham": "/west_ham.png",
  "Wolves": "/wolves.png",
  "Wolverhampton Wanderers": "/wolves.png",

  // --- La Liga ---
  "Alavés": "/alaves.png",
  "Alaves": "/alaves.png",
  "Deportivo Alavés": "/alaves.png",
  "Athletic Club": "/athletic_club.png",
  "Athletic Bilbao": "/athletic_club.png",
  "Atlético Madrid": "/atletico_madrid.png",
  "Atletico Madrid": "/atletico_madrid.png",
  "Atletico de Madrid": "/atletico_madrid.png",
  "Barcelona": "/barcelona.png",
  "FC Barcelona": "/barcelona.png",
  "Celta Vigo": "/celta_vigo.png",
  "Celta de Vigo": "/celta_vigo.png",
  "Deportivo": "/deportivo.png",
  "Deportivo La Coruña": "/deportivo.png",
  "Deportivo La Coruna": "/deportivo.png",
  "Elche": "/elche.png",
  "Elche CF": "/elche.png",
  "Espanyol": "/espanyol.png",
  "RCD Espanyol": "/espanyol.png",
  "Getafe": "/getafe.png",
  "Getafe CF": "/getafe.png",
  "Girona": "/girona.png",
  "Granada": "/granada.png",
  "Granada CF": "/granada.png",
  "Levante": "/levante.png",
  "Levante UD": "/levante.png",
  "Málaga": "/malaga.png",
  "Malaga": "/malaga.png",
  "Málaga CF": "/malaga.png",
  "Mallorca": "/mallorca.png",
  "RCD Mallorca": "/mallorca.png",
  "Osasuna": "/osasuna.png",
  "CA Osasuna": "/osasuna.png",
  "Racing Santander": "/racing_santander.png",
  "Real Racing Club": "/racing_santander.png",
  "Rayo Vallecano": "/rayo_vallecano.png",
  "Real Betis": "/real_betis.png",
  "Real Madrid": "/real_madrid.png",
  "Real Oviedo": "/real_oviedo.png",
  "Real Sociedad": "/real_sociedad.png",
  "Real Valladolid": "/valladolid.png",
  "Valladolid": "/valladolid.png",
  "Sevilla": "/sevilla.png",
  "Sevilla FC": "/sevilla.png",
  "Valencia": "/valencia.png",
  "Valencia CF": "/valencia.png",
  "Villarreal": "/villarreal.png",
  "Villarreal CF": "/villarreal.png",
};

export function getTeamLogo(teamName: string): string | undefined {
  if (!teamName) return undefined;
  if (TEAM_LOGOS[teamName]) return TEAM_LOGOS[teamName];

  // Case & Accent-insensitive fallback matching
  const normalized = teamName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  for (const [key, path] of Object.entries(TEAM_LOGOS)) {
    const keyNormalized = key
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
    if (keyNormalized === normalized) {
      return path;
    }
  }

  return undefined;
}

