const { promise_pool } = require("../../database");


module.exports = {
  updateUserPlayLimit: async (msisdn, play_limit) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.UPDATE_USER_PLAY_LIMIT,
        [
          play_limit,
          msisdn
        ]
      );
      return [null, "Limit updated successfully ->"]
    } catch (e) {
      console.log(e)
      return [e?.sqlMessage ?? "update limit erorr"];
    } 
  },
  deleteFromInstantSessionNew: async (msisdn) => {
    console.log("delete session =>", process.env.DELETE_FOR_INSTANT_SESSION_NEW, [msisdn])
    try {
      const [ok] = await promise_pool.query(
        process.env.DELETE_FOR_INSTANT_SESSION_NEW,
        [msisdn]
      );
      return [null, "Deleted instant session"];
    } catch (e) {
      console.log(e)
      return [e?.sqlMessage || "error"];
    }
  },
  getCurrentRevenue: async () => {
    try {
      const [row] = await promise_pool.query(process.env.GET_CURRENT_REVENUE);

      return [null, row[0]?.total_revenue ?? 0];
    } catch (e) {
      return [e];
    }
  },
  insertInstantGameLogs: async (
    msisdn,
    trxid,
    pisisid,
    pisipid,
    type,
    status
  ) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.insertInstantlogs,
        [msisdn, trxid, pisisid, pisipid, type, status]
      );
      return [null, "Updated instant session"];
    } catch (error) {
      return [error];
    }
  },
  updateInstantSession: async (msisdn, keyword, matched, combination) => {
    console.log(
      process.env.UPDATE_INSTANT_SESSION_NEW.replace(
        "<KEY_WORD>",
        keyword
      ).replace(
        "<MATCHED>",
        matched
      ).replace(
        "<COMBINATION>",
        JSON.stringify(combination)
      ).replace(
        "<ANI>", msisdn
      ));
    try {
      const [ok] = await promise_pool.query(
        process.env.UPDATE_INSTANT_SESSION_NEW.replace(
          "<KEY_WORD>",
          keyword
        ).replace(
          "<MATCHED>",
          matched
        ).replace(
          "<COMBINATION>",
          JSON.stringify(combination)
        ).replace(
          "<ANI>", msisdn
        ),
        [
          keyword,
          matched,
          JSON.stringify(combination),
          msisdn
        ]
      );
      return [null, "Updated instant session"];
    } catch (error) {
      console.log(error)
      return [error?.sqlMessage ?? "update instant session error"];
    }
  },
  insertIntoInstantLogs: async (msisdn) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.INSERT_INTO_INSTANT_LOGS_NEW,
        [msisdn]
      );
      // console.log(ok)
      return [null, "Inserted instant logs"];
    } catch (e) {
      console.log(e)
      return [e?.sqlMessage ?? "erorr"];
    }
  },
  getCurrentDayWinner: async () => {
    try {
      const [row] = await promise_pool.query(
        process.env.CHECK_TODAY_WINNER
      );
      return [null, row]
    } catch (e) {
      return [e]
    }
  },
};
