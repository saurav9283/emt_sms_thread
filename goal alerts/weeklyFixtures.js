
require("dotenv").config();

const axios = require("axios");
const {
  teamAbbreviations,
  getTeamAbbreviation,
  formatForDisplay,
} = require("./teamAbbreviation");
const { pool } = require("../database");

module.exports = {
  getWeeklyFixtures: async (req, res) => {
    const { league, season, from, to } = req.query;
    console.log("query", league, season, from, to);

    try {
      const apiresponse = await axios.get(
        "https://api-football-v1.p.rapidapi.com/v3/fixtures",
        {
          params: {
            league: league,
            season: season,
            from: from,
            to: to,
          },
          headers: {
            "X-RapidAPI-Key": process.env.RAPID_API_KEY,
            "X-RapidAPI-Host": process.env.RAPID_API_HOST,
          },
        }
      );

      const transformResponse = (data) => {
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
          halfTime: `HT: H ${data.score?.halftime?.home || "0"}-${data.score?.halftime?.away || "0"} A`,
          fullTime: `FT: H ${data.score?.fulltime?.home || "0"}-${data.score?.fulltime?.away || "0"} A `,
          penalty: `PN: H ${data.score?.penalty?.home || "0"}-${ data.score?.penalty?.away || "0"} A`,
          winner: winnerName,
        };
        transformed.display = formatForDisplay(transformed);
        return transformed;
      };

      const modifiedResponse = apiresponse.data.response.map(transformResponse);

      for (let fixture of modifiedResponse) {
        try {
          await insertFixtureIntoDB(fixture);
          await insertMessageIntoDB(fixture);
        } catch (err) {
          console.error("Error inserting into the database: ", err.message);
        }
      }

      res.json(modifiedResponse);
    } catch (error) {
      console.error("Error while processing the request:", error.message);

      if (error.response) {
        console.error("Server response data:", error.response.data);
        console.error("Server response status:", error.response.status);
      } else if (error.request) {
        console.error("Request made but no response:", error.request);
      } else {
        console.error("Error setting up the request:", error.message);
      }

      res.status(500).json({ error: "Failed to fetch data from RapidAPI" });
    }
  },
};

const insertFixtureIntoDB = async (fixture) => {
  return new Promise((resolve, reject) => {
    const sql = `
              INSERT INTO tbl_pl_fixtures (
                  fixture_id, homeTeam, awayTeam, matchStatus, 
                  date, time, timeZone, venue, homeGoals, awayGoals, 
                  halfTime, fullTime, penalty, winner
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
              homeTeam = VALUES(homeTeam),
              awayTeam = VALUES(awayTeam),
              matchStatus = VALUES(matchStatus),
              date = VALUES(date),
              time = VALUES(time),
              timeZone = VALUES(timeZone),
              venue = VALUES(venue),
              homeGoals = VALUES(homeGoals),
              awayGoals = VALUES(awayGoals),
              halfTime = VALUES(halfTime),
              fullTime = VALUES(fullTime),
              penalty = VALUES(penalty),
              winner = VALUES(winner)
          `;

    const values = [
      fixture.fixture_id,
      fixture.homeTeam,
      fixture.awayTeam,
      fixture.matchStatus,
      fixture.date,
      fixture.time,
      fixture.timeZone,
      fixture.venue,
      fixture.homeGoals,
      fixture.awayGoals,
      fixture.halfTime,
      fixture.fullTime,
      fixture.penalty,
      fixture.winner,
    ];

    pool.query(sql, values, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

const insertMessageIntoDB = async (fixture) => {
  return new Promise((resolve, reject) => {
    const sql = `
              INSERT INTO tbl_messages (
                  fixture_id, display
              ) VALUES (?, ?)
              ON DUPLICATE KEY UPDATE
              display = VALUES(display)
          `;

    const values = [fixture.fixture_id, fixture.display];

    pool.query(sql, values, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};
