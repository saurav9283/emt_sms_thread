const { pool, promise_pool } = require("../database");

module.exports = {
  getRandomWelcomeQuestion: async (msisdn) => {
    let RANDOM_SMS_QUERY = process.env.SELECT_WELCOME_QUESTION_SMS.replaceAll(
      "<MSISDN>",
      msisdn
    );

    console.log("QUES_QUERY", RANDOM_SMS_QUERY);

    try {
      const [row] = await promise_pool.query(RANDOM_SMS_QUERY);
      return [null, row[0]];
    } catch (e) {
      console.log(" ERROR_AT_GETTING_WELCOME_SMS");
      return [e];
    }
  },

  insertIntoUserSession: async (
    msisdn,
    first_question_id,
    first_correct_option,
    is_First_ans_correct,
    trxid,
    first_question,
    sms_key
  ) => {
    try {
      const [ok] = await promise_pool.query(
        "INSERT INTO tbl_user_session SET ?",
        {
          msisdn: msisdn,
          first_question_id,
          is_First_ans_correct,
          first_correct_option,
          trxid,
          first_question,
          sms_key,
        }
      );
      return [null, "Successfully saved in user logs"];
    } catch (e) {
      console.log("ERROR_IN_USER_SESSION", e);
      return [e];
    }
  },
  updateUserSessionOnAnswer: async (ansObj, msisdn) => {
    let UPDATE_USER_SESSION_QUERY =
      process.env.UPDATE_USER_SESSION_ON_ANSWER.replace(
        "<COLOUMN>",
        Object.keys(ansObj)[0]
      )
        .replace("<IS_CORRECT>", Object.values(ansObj)[0])
        .replace("<MSISDN>", msisdn);

    console.log({
      UPDATE_USER_SESSION_QUERY,
    });
    try {
      const [ok] = await promise_pool.query(UPDATE_USER_SESSION_QUERY);
      return [null, "Updated user session success fully"];
    } catch (e) {
      console.log("ERROR_IN_UPDATE_USER_SESSION", e);
      return [e];
    }
  },
  updateUserSessionWithNewQuestion: async (
    second_question_id,
    is_second_ans_correct,
    second_correct_option,
    second_question,
    msisdn
  ) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.UPDATE_USER_SESSION_WITH_NEW_QUESTION,
        [
          second_question_id,
          is_second_ans_correct,
          second_correct_option,
          second_question,
          msisdn,
        ]
      );
      console.log("UPDATED USER SESSION SUCCESSFULLY ->", [msisdn]);
      return [null, "Successfully updated new question"];
    } catch (e) {
      console.log("ERROR IN UPDATING USER SESSION ->");
      throw new Error("error in update user session with new values " + e);
    }
  },
  checkPendingAnswers: async (msisdn) => {
    let CHECK_PENDING_ANSWERS = process.env.SELECT_FROM_USER_SESSION.replace(
      "<MSISDN>",
      msisdn
    );

    console.log({
      CHECK_PENDING_ANSWERS,
    });
    try {
      const [result] = await promise_pool.query(CHECK_PENDING_ANSWERS);

      console.log(result);
      return [null, result[0]];
    } catch (err) {
      console.log("GOT_ERROR_IN_PENDING_CHECK", err);
      return [err, null];
    }
  },
  insertIntoUserLogsOnAllQuestionAsked: async (msisdn) => {
    var querys = [
      process.env.INSERT_INTO_USER_LOGS,
      process.env.DELETE_FROM_USER_SESSION,
    ];

    const result = querys.map(async (current) => {
      let selectedQuery = current.replace("<MSISDN>", msisdn);

      console.log("USER_SESSION_END_QUERYS", selectedQuery);

      try {
        const [ok] = await promise_pool.query(selectedQuery);

        return [null, "SUCCESS"];
      } catch (e) {
        console.log("FAILED TO INSERT USER LOGS", e);
        return [e, null];
      }
    });
    const allDone = await Promise.allSettled(result);
    console.log(allDone);
    return true;
  },
  deleteFormSmsPending: async (msisdn, service) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.DELETE_FROM_SMS_PENDING_ALL,
        [msisdn, service]
      );
      return [null, "Deleted form sms pending"];
    } catch (e) {
      console.log(e);
      return [e];
    }
  },
  checkExistingSub: async (msisdn, service) => {
    console.log(process.env.CHECK_EXISTING_SUB);
    return new Promise((res, rej) => {
      pool.query(
        process.env.CHECK_EXISTING_SUB,
        [msisdn, service],
        (err, exist) => {
          if (err) return res([err, null]);
          return res([null, exist[0]?.EXIST || 0]);
        }
      );
    });
  },
};
