const { promise_pool, pool } = require("../database");

module.exports = {
  getLiveScore: async () => {
    try {
      const [row] = await promise_pool.query(
        process.env.GET_CURRENT_MATCH_UPDATE
      );
      return [null, row];
    } catch (e) {
      return ["error in get live score", null];
    }
  },
 insertIntoSmsSentGoalNews: async (
    msisdn,
    type_event,
    message_id,
    status
  ) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.INSERT_INTO_GOAL_NEWS_SENT,
        [
          msisdn,
          type_event,
          message_id,
          status
        ]
    );
      return [null, "Inserted into sms sent ->"];
    } catch (e) {
      console.log(e);
      return ["failed to insert into tbl sms sent"];
    }
  },
  insertIntoSmsSentFootballQuiz: async (
    msisdn,
    type_event,
    message_id,
    status
  ) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.INSERT_INTO_FOOTBAL_SENT,
        [
          msisdn,
          type_event,
          message_id,
          status
        ]
    );
      return [null, "Inserted into sms sent ->"];
    } catch (e) {
      console.log(e);
      return ["failed to insert into tbl sms sent"];
    }
  },
  insertIntoSmsSent: async (
    msisdn,
    trxid,
    type_event,
    packType,
    service,
    message,
    request,
    response,
    status,
    messageId
  ) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.INSERT_INTO_SMS_SENT,
        [
            msisdn,
            trxid,
            type_event,
            service,
            message,
            request,
            response,
            status,
            messageId
        ]
    );
      return [null, "Inserted into sms sent ->"];
    } catch (e) {
      console.log(e);
      return ["failed to insert into tbl sms sent"];
    }
  },
  getDailyUpcomingMatches: async () => {
    try {
      const [ok] = await promise_pool.query(process.env.GET_UPCOMING_MATCHES);
      return [null, ok ?? 0];
    } catch (e) {
      console.log(e, "ERROR GETTING UPCOMING MATCHES");
      return [e];
    }
  },
  checkUpcomingSent: async () => {
    try {
      const [rows] = await promise_pool.query(
        process.env.CHECK_UPCOMING_SENT_TODAY
      );
      return [null, rows[0]?.UPCOMING_SENT || 0];
    } catch (e) {
      console.log(e, "UPCOMING SENT ->");
      return [e];
    }
  },
  // send daily matches reinder
  getTodayMatchFromDb: async () => {
    try {
      const [row] = await promise_pool.query(
        process.env.GET_TODAY_MATCHES_DATAILS
      );
      return [null, row]
    } catch (e) {
      return [e]
    }
  },
  getMsisdnForCurrrentMatchAlert: async () => {
    console.log(process.env.GET_CURRENT_MATCH_PENDING_MSISDN)
    try {
      const [row] = await promise_pool.query(
        process.env.GET_CURRENT_MATCH_PENDING_MSISDN
      );
      return [null, row]
    } catch (e) {
      return [e]
    }
  },
  getPendingMsisdnForGoalNews: async () => {
    try{ 
      const [row] = await promise_pool.query(
        process.env.GET_CURRENT_NEWS_PENDING_MSISDN
      );
      return [null, row]
    } catch(e) {
      return [e]
    }
  },
  getRandomGoalAlertNews: async (msisdn) => {

    try { 
      const [row] = await promise_pool.query(
        process.env.GET_RANDOM_GOAL_NEWS_TO_SEND.replaceAll(
          "<MSISDN>",
          msisdn
        )
      );

      return [null, row[0]]
    } catch (e) {
      return [e]
    }
  },
  insertMsidnForGoalNwes: async () => {
    try {
      const [ok] = await promise_pool.query(
        process.env.PICK_NUMBER_FOR_DAILY_NEWS
      );
      console.log("picked new sub for daily sms news")
      return true;
    } catch (e) {
      console.log(e)
      return false;
    }
  },
  insertIntoLiveAlertSent: async (msisdn, fixtureid, sms) => {
    try {
      const [ok]=  await promise_pool.query(
        process.env.INSERT_INTO_LIVE_ALERT_SENT,
        [
          msisdn,
          fixtureid,
          sms
        ]
      );
      return [null, "Inserted into live alert sent."]
    } catch (e) {
      console.log(e)
      return [e]
    }
  },
  updateLiveMatchStatus: async (fixtureid) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.UPDATE_MATCH_STATUS,
        [
          fixtureid
        ]
      );
      return [null, "OK"]
    } catch(e) {
      console.log(e)
      return [e]
    }
  },
  updateSmsPending: async (msidnId) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.UPDATE_SMS_PENDING_ON_SMS_HIT,
        [
          msidnId
        ]
      );
      return [null, "OK"]
    } catch(e) {
      console.log(e)
      return [e]
    }
  }
};
