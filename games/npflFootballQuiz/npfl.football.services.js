const { promise_pool } = require("../../database");
const { upadteUserPoints } = require("../../services/sms.services");

module.exports = {
  _npfl_getRandomWelcomeQuestion: async (msisdn) => {
    let RANDOM_SMS_QUERY =
      process.env.SELECT_WELCOME_QUESTION_SMS_NPFL.replaceAll(
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
  _npfl_insertIntoTableAnswer: async (msisdn, questionId, correctOption) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.INSERT_INTO_TABLE_ANSWERS_NPFL,
        [msisdn, questionId, correctOption]
      );
      return [null, "Insserted into tbl answer successfully"];
    } catch (e) {
      console.log(e, "IN CORRECT OPTION ID ->");
      return [e];
    }
  },

  _npfl_insertIntoUserAnswerLogs: async (
    msisdn,
    questionId,
    correct_option,
    type_event,
    trxid
  ) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.INSERT_INTO_TABLE_ANSWERS_LOGS_NPFL,
        [msisdn, questionId, correct_option, type_event, trxid]
      );
      return [null, "Inserted into answers logs"];
    } catch (e) {
      console.log(e, "IN INSERT ANSWER LOGS");
      return [e];
    }
  },
  _npfl_compareAnswers: async (msisdn, answer) => {
    try {
      const [reslts] = await promise_pool.query(
        process.env.COMPARE_ANSWERS_QUERY_NPFL,
        [msisdn, answer]
      );
      return [null, reslts[0].CORRECT];
    } catch (e) {
      console.log(e, "IN COMPARE ANSWERS");
      return [e];
    }
  },
  _npfl_updateAnswersLogs: async (msisdn, matched) => {
    let UPDATE_USER_LOGS_QUERY = process.env.UPDATE_ANSWER_LOGS_NPFL.replace(
      "<MATCHED>",
      Number(matched) === 1 ? "yes" : "no"
    ).replace("<MSISDN>", msisdn);

    console.log("ANS_LOGS ->", UPDATE_USER_LOGS_QUERY);

    try {
      const [ok] = await promise_pool.query(UPDATE_USER_LOGS_QUERY);
      return [null, "Updated user answer logs"];
    } catch (e) {
      console.log(e, "IN UPDATE ANSWER LOGS");
      return [e];
    }
  },
  _npfl_checkPendingAnswersLog: async (msisdn) => {
    try {
      const [row] = await promise_pool.query(
        process.env.GET_PENDING_ANSWERS_NPFL,
        [msisdn]
      );
      return [null, row];
    } catch (e) {
      console.log(e, "IN CHECK PENDING ANSWERS");
      return [e];
    }
  },
  _npfl_insertUserAllLogs: async (
    msisdn,
    q_id_1,
    answer1,
    matched1,
    q_id_2,
    answer2,
    matched2,
    type_event
  ) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.INSERT_INTO_USER_ANSWER_LOGS_NPFL,
        [
          msisdn,
          q_id_1,
          answer1,
          matched1,
          q_id_2,
          answer2,
          matched2,
          type_event,
        ]
      );
      return [null, "Inserted into user answers logs session closed"];
    } catch (e) {
      console.log(e, "IN INSERT USER ANSWERS LOGS ->");
      return [e];
    }
  },
  _npfl_deleteFormTblAnsLogs: async (msisdn) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.DELETE_FROM_TBL_ANSWER_LOGS_NPFL,
        [msisdn]
      );
      return [null, "Done deleting from tbl ans logs"];
    } catch (e) {
      console.log(e, "ERROR IN DELETING ANS LOGS ->");
      return [e];
    }
  },
  _npfl_deleteFormTblAns: async (msisdn) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.DELETE_FROM_TBL_ANS_NPFL,
        [msisdn]
      );
      return [null, "Done deleting from tbl ans logs"];
    } catch (e) {
      console.log(e, "ERROR IN DELETING ANS LOGS ->");
      return [e];
    }
  },
  _npfl_deleteOnSmsExpire: async (msisdn) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.DELETE_ON_ANSWER_EXPIRE_NPFL,
        [msisdn]
      );
      return [null, "Delete on sms expire"];
    } catch (e) {
      console.log(e);
      return ["Failed to delete from logs on time expire ->"];
    }
  },
  _npfl_upadteUserPoints: async (msisdn) => {
    try {
      const [Updated] = await promise_pool.query(
        process.env.UPDATE_USER_POINTS_NPFL,
        [msisdn]
      );
      console.log(Updated.info, "UPDATED USER POINTS");
      return [null, "Updated user points"];
    } catch (e) {
      console.log("CANNOT UPDATE USER POINTS", e);
      return [e];
    }
  },
  _npfl_insertUserPoints: async (msisdn) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.INSERT_INTO_USER_TABLE_NPFL,
        [msisdn, process.env.DEFAULT_POINTS]
      );
      return [null, "Saved user points successfully"];
    } catch (e) {
      console.log("ERROR_IN_USER_INSERT_POINTS", e);
      return [e];
    }
  },
  _npfl_checkExistingPoints: async (msisdn) => {
    try {
      const [exist] = await promise_pool.query(
        process.env.CHECK_USER_POINTS_NPFL,
        [msisdn]
      );
      return [null, exist[0]];
    } catch (e) {
      console.log("EXISTING_POINTS", e);
      return [e];
    }
  },
  _npfl_deletedUserPoints: async (msisdn) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.DELETE_FROM_USER_TABLE_NPFL,
        [msisdn]
      );
      return [null, "Deleted from user table"];
    } catch (e) {
      console.log(e, "ERROR IN DELETE USER POINTS TABLE");
      return [e];
    }
  },
  _npfl_handelSms: (fist, second, points, message) => {
    let sms_type;

    if (!fist && !second) {
      return (sms_type = SMS_PREFIX + " " + message);
    }

    if (!second) {
      if (fist.matched === "yes") {
        // first answer is corret
        return (sms_type =
          one_correct.replace("<POINTS>", points) + " " + message);
      } else {
        // first is incorrect
        return (sms_type =
          one_incorrect.replace("<POINTS>", points) + " " + message);
      }
    }

    // both answered ->>>>
    switch (true) {
      case fist.matched === "yes" && second.matched === "yes":
        sms_type = all_correct.replace("<POINTS>", points);
        break;

      case fist.matched === "no" && second.matched === "no":
        sms_type = all_incorrect.replace("<POINTS>", points);
        break;

      case second.matched === "yes":
        console.log("SECOND ->");
        sms_type = second_correct.replace("<POINTS>", points);
        break;

      default:
        console.log("second failed");
        sms_type = tomorow;
        break;
    }
    return sms_type;
  },
};

var SMS_PREFIX = `Congratulations! You've earned
10 points and qualified for the
daily draw upon your subscription
for Football Trivia daily.
Earn more points and stand better
chances of winning upto 60
Million Naira andAirtime.`;

var one_incorrect = `Sorry, let's try again. Gather more to 
stand a chance to win today if you answer the next question correctly.
`;

var one_correct = `Congratulations, you now have <POINTS> points.
 Gather more to stand a chance to win today!`;

var all_incorrect = `
oops, you’ve failed again.
Reply with PLAYQ to earn more
points and stand a better chance
of winning cash prizes and
airtime. You will be charged
N50/Game.
`;

var all_correct = `
Congratulations! You've earned
<POINTS> points and qualified for
today's draw. You will be notified
of the result by SMS.
Reply with PLAYQ too earn more
points and stand a better chance
of winning cash prizes and
airtime. You will be charged
N50/Game.
`;

var second_correct = `
Congratulations! You've earned
<POINTS> points and qualified for
today's draw. You will be notified
of the result by SMS.
Reply with PLAYQ  too earn more
points and stand a better chance
of winning cash prizes and
airtime. You will be charged
N50/Game
`;

var tomorow = `
Sorry, let's try again tomorrow. You can also gather more points by sending PLAYQ to 20782
`;
