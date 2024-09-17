require("dotenv").config();

const axios = require("axios");
const transformFixture = require("./transformResponse");
const { pool } = require("../database");

module.exports = {
  getLiveMatchesForToday: async (league, season) => {
    const today = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();

    console.log("LIVE MATCHES ->", today);
    try {
      const response = await axios.get(
        "https://api-football-v1.p.rapidapi.com/v3/fixtures",
        {
          params: {
            league: league,
            season: currentYear, // Use current year dynamically
            date: today,
            timezone: "Africa/Lagos",
          },
          headers: {
            "X-RapidAPI-Key": process.env.RAPID_API_KEY,
            "X-RapidAPI-Host": process.env.RAPID_API_HOST,
          },
        }
      );
      //console.dir(await response.data.response, { depth: null})
      const modifiedResponse = await response.data.response.map(
        transformFixture
      );
      //console.log(modifiedResponse)
      const desiredStatuses = ["FIRST HALF", "SECOND HALF", "NOT STARTED"];
      // console.log(desiredStatuses)
      const liveMatches = modifiedResponse.filter((match) =>
        desiredStatuses.includes(match.matchStatus)
      );

      for (let fixture of modifiedResponse) {
        // console.log(fixture)
        try {
          await insertFixtureIntoDB(fixture);
          //  insertMessageIntoDB(fixture);
          console.log("live match updated->");
        } catch (err) {
          console.error("Error inserting into the database: ", err);
        }
      }

      if (liveMatches.length === 0) {
        return { error: 2, msg: "There are no live matches currently." };
      } else {
        return { error: 0, msg: liveMatches };
      }
    } catch (error) {
      console.error("Error fetching data:", error?.response?.data);
      return { error: 1, msg: "Failed to fetch data" };
    }
  },
};

const insertFixtureIntoDB = async (fixture) => {
  const sql = `
            INSERT INTO tbl_pl_fixtures (
                fixture_id, homeTeam, awayTeam, matchStatus, 
                date, time, timeZone, venue, homeGoals, awayGoals, 
                halfTime, fullTime, penalty, winner, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            winner = VALUES(winner),
            status = VALUES(status)
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
    fixture.status,
  ];

  pool.query(sql, values, (err, ok) => {
    if (err) {
      console.log(err);
      return false;
    }
    return true;
  });
};

const insertMessageIntoDB = async (fixture) => {
  const sql = `
            INSERT INTO tbl_messages (
                fixture_id, display
            ) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE
            display = VALUES(display)
        `;

  const values = [fixture.fixture_id, fixture.display];

  pool.query(sql, values, (err, ok) => {
    if (err) {
      console.log(err, "in message into db");
      return false;
    }
    return true;
  });
};
