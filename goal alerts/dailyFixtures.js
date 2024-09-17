require("dotenv").config();

const axios = require("axios");

const transformFixture = require("./transformResponse");
const moment = require("moment/moment");
const { pool } = require("../database");

module.exports = {
  getDailyMatches: async (league, season, date) => {
    console.log("getting daily matches and upcoming", league, season, date);
    // aaj ka kal ka
    try {
      const getFixtures = async (date) => {
        const params = {
          league: league,
          season: season,
          date: date,
          timezone: "Africa/Lagos",
        };

        const headers = {
          "X-RapidAPI-Key": process.env.RAPID_API_KEY,
          "X-RapidAPI-Host": process.env.RAPID_API_HOST,
        };

        // Log the parameters and headers
        console.log("Request Params:", params);
        console.log("Request Headers:", headers);
        const response = await axios.get(
          "https://api-football-v1.p.rapidapi.com/v3/fixtures",
          {
            params: params,
            headers: headers,
          }
        );

        console.log("response from api => ", response.data.response);
        return await response.data.response;
      };

      const currentDay = new Date(date);
      const yesterday = new Date(currentDay);
      yesterday.setDate(currentDay.getDate() - 1);

      const tomorrow = new Date(currentDay);
      tomorrow.setDate(currentDay.getDate() + 1);

      const yesterdayFixtures = (await getFixtures(yesterday)).map(
        transformFixture
      );
      const tomorrowFixtures = (await getFixtures(tomorrow)).map(
        transformFixture
      );

      let responseObj = {};

      if (yesterdayFixtures.length === 0) {
        responseObj.yesterday = 0;
      } else {
        responseObj.yesterday = yesterdayFixtures;
      }

      if (tomorrowFixtures.length === 0) {
        responseObj.tomorrow = 0;
      } else {
        responseObj.tomorrow = tomorrowFixtures;
      }

      return { error: null, responseObj };
    } catch (error) {
      return { error: error.response?.data, responseObj: null };
    }
  },

  getCurrentMatches: async (league, season, date) => {
    console.log("getting today matches ->", league, season, date);
    // current day matches
    try {
      const response = await axios.get(
        "https://api-football-v1.p.rapidapi.com/v3/fixtures",
        {
          params: {
            league: league,
            season: season,
            date: date,
          },
          headers: {
            "X-RapidAPI-Key": process.env.RAPID_API_KEY,
            "X-RapidAPI-Host": process.env.RAPID_API_HOST,
          },
        }
      );

      const modifiedResponse = await response.data.response.map(
        transformFixture
      );

      // console.log("GOT DAILY MATCHES RESUTL ->", modifiedResponse);

      for (let fixture of modifiedResponse) {
        try {
          await insertFixtureIntoDB(fixture);
        } catch (err) {
          console.error("Error inserting into the database: ", err);
        }
      }
      if (modifiedResponse.length === 0) {
        return { matches: "NO matches currently ->", error: null };
      } else {
        return { error: null, matches: modifiedResponse };
      }
    } catch (error) {
      return {
        error: error.response?.data,
        matches: "API ERROR GETTING CURRENT DAY MATCHES",
      };
    }
  },
};

const insertFixtureIntoDB = async (fixture) => {
  return new Promise((resolve, reject) => {
    const sql = `
          INSERT INTO tbl_pl_fixtures_daily (
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
