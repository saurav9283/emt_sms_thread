

const teamAbbreviations = {
    "ARS": "Arsenal",
    "AST": "Aston Villa",
    "CHE": "Chelsea",
    "EVE": "Everton",
    "BUR": "Burnley",
    "LIV": "Liverpool",
    "MNU": "Manchester United",
    "MNC": "Manchester City",
    "LEI": "Leicester City",
    "HUL": "Hull City",
    "PAL": "Crystal Palace",
    "NEW": "Newcastle United",
    "TOT": "Tottenham Hotspur",
    "SUN": "Sunderland",
    "SOT": "Southampton",
    "SWA": "Swansea City",
    "WHU": "West Ham United",
    "WAT": "Watford",
    "STO": "Stoke City",
    "NOR": "Norwich",
    "BOU": "Bournemouth",
    "FUL": "Fulham",
    "WOL": "Wolves",
    "WBA": "West Bromwich Albion",
    "IPS": "Ipswich",
    "LEE": "Leeds United",
    "DER": "Derby County",
    "BRE": "Brentford",
    "HUD": "Huddersfield",
    "BHA": "Brighton",
    "REA": "Reading",
    "BIR": "Birmingham",
    "MID": "Middlesbrough",
    "WIG": "Wigan",
    "FOR": "Nottingham Forest",
    "MIL": "Millwall",
    "LUT": "Luton",
    "TOT": "Tottenham",
    "NEW": "Newcastle",
    "WHU": "West Ham",
    "SHE": "Sheffield Utd"
}
const getTeamAbbreviation = (teamName) => {
    const abbreviation = Object.keys(teamAbbreviations).find(key => teamAbbreviations[key] === teamName);
    return abbreviation || teamName;
};

const formatForDisplay = (data) => {
    const homeTeamAbbr = getTeamAbbreviation(data.homeTeam);
    const awayTeamAbbr = getTeamAbbreviation(data.awayTeam);

    let winnerString;
    if (data.winner === 'Draw') {
        winnerString = 'Match Drawn!';
    } else if (data.winner) {
        winnerString = `${getTeamAbbreviation(data.winner)} won!`;
    } else {
        winnerString = 'Winner: Not Decided';
    }

    const homeGoals = data.homeGoals || '0';
    const awayGoals = data.awayGoals || '0';

    // Extract only the city name from the venue
    const venueCity = data.venue.split(',')[0];

    return [
        `${homeTeamAbbr} vs ${awayTeamAbbr}`,
        `${data.date}, ${data.time} ${data.timeZone}`,
        `FT: ${homeTeamAbbr}(H) ${homeGoals}-${awayGoals} ${awayTeamAbbr}(A)`,
        `HT: ${data.halfTime.replace('home:', '').replace('away:', '-')}`,
        `${venueCity}`, // Use the extracted city name
        winnerString
    ].join('\n');
    
};



module.exports = {
    teamAbbreviations,
    getTeamAbbreviation,
    formatForDisplay
};
