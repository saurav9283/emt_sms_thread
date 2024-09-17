const formatForDisplay = require("./teamAbbreviation").formatForDisplay;

const transformFixture = (data) => {
  let winnerName;

  if (data.fixture?.status?.long === "Not Started") {
    winnerName = null;
  } else if (data.teams.home.winner === true) {
    winnerName = data.teams.home.name;
  } else if (data.teams.away.winner === true) {
    winnerName = data.teams.away.name;
  } else if (
    data.goals.home === data.goals.away &&
    data.goals.home !== 0 &&
    data.goals.away !== 0
  ) {
    winnerName = "Draw";
  } else {
    winnerName = null;
  }

  let status = data.fixture?.status?.long == "Match Finished" ? "1" : "0"

  const transformed = {
    fixture_id: data.fixture?.id?.toString(),
    homeTeam: data.teams?.home?.name,
    awayTeam: data.teams?.away?.name,
    matchStatus: data.fixture?.status?.long,
    date: data.fixture?.date?.split("T")[0],
    time: data.fixture?.date?.split("T")[1].split("+")[0],
    timeZone: data.fixture?.timezone,
    venue: data.fixture?.venue.city,
    homeGoals: data.goals?.home?.toString(),
    awayGoals: data.goals?.away?.toString(),
    halfTime: `HT: H ${data.goals?.home || "0"}-${data.goals?.away || "0"} A`,
    fullTime: `FT: H ${data.goals?.home || "0"}-${data.goals?.away || "0"} A `,
    penalty: `PN: H ${data.score?.penalty?.home || "0"}-${ data.score?.penalty?.away || "0"} A`,
    winner: winnerName,
    status
  };

  transformed.display = formatForDisplay(transformed);

  return transformed;
};

module.exports = transformFixture;
// HT: H 0-0 A
// FT: H 3-3 A
// ET: H 3-2 A
// PN: H 1-2 A