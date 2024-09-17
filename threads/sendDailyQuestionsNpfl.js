const { promise_pool } = require("../database");
const {
  _npfl_getRandomWelcomeQuestion,
  _npfl_insertIntoUserAnswerLogs,
  _npfl_insertIntoTableAnswer,
} = require("../games/npflFootballQuiz/npfl.football.services");
const { insertIntoSmsSent } = require("../goal alerts/goal.alert.services");
const { sendSms } = require("../lib/sendSms");
const {
  deleteFormSmsPending,
} = require("../services/callback.services");

module.exports = {
  _npflsendLiveQuestions: async () => {
    for (; ;) {
      await _npflsendQuestions();
      await sleep(5);
    }
  },
};

async function _npflsendQuestions() {

  try {
    const [error1, pendingSubscribers] = await _npflgetAllMsisdn();

    if (error1) {
      console.error(`Error fetching subscribers: ${error1}`);
      return;
    }

    console.log("Pending NPFL footbal sms ->", pendingSubscribers.length);

    if (pendingSubscribers.length > 0) {
      // Notify all pending subscribers

      const notificationPromises = pendingSubscribers.map(
        async ({ msisdn, trxid, service, type_event }) => {
          const [paramsError, smsParams] = await _npfl_getRandomWelcomeQuestion(
            msisdn
          );

          if (paramsError)
            return console.log("ERROR IN NPFL SMS PARAMS", paramsError);

          const sms = smsParams.message;

          var smsPayload = {
            pisisid: process.env._NPFL_FOOTBALL_PISISID,
            msisdn,
            message: sms,
            trxid,
          };

          console.log({ smsPayload });
          // sending user sms
          const [smsError, success] = await sendSms(smsPayload);
          if (smsError) {
            return `[error]_quiz => ${msisdn}`;
          }
          await _npfl_insertIntoUserAnswerLogs(
            msisdn,
            smsParams.id, // question id
            smsParams.correct_option, // correct option
            type_event,
            trxid
          );
          // for compare
          await _npfl_insertIntoTableAnswer(
            msisdn,
            smsParams.id, // question id
            smsParams.correct_option // correct option
          );

          const [e0, saved] = await _npfl_insertIntoSmsSentFootballQuiz(
            msisdn,
            type_event,
            smsParams.id,
            'NPFL_FOOTBALL_QUIZ'
          );

          if (e0) {
            throw new Error(`Error inserting SMS sent logs: ${e0}`);
          }
          const [e1, ok] = await deleteFormSmsPending(msisdn, service);
          if (e1) {
            throw new Error(`Error deleting pending SMS: ${e1}`);
          }
          return `[success]_quiz => ${msisdn}`;
        }
      );

      const results = await Promise.all(notificationPromises);
      console.log(results);
      return results;
    } else {
      console.log('sleeping for 2 hours, football =>');
      return await sleep(2 * 60 * 60);
    }
  } catch (e) {
    console.error(`Error in sending quiz questions:`, e);
    return `Error in sending quiz questions: ${e.message}`;
  }
}

async function _npflgetAllMsisdn() {
  try {
    const [rows] = await promise_pool.query(
      process.env.PICK_MSISDN_FOR_FOOTBALL_NPFL
    );
    return [null, rows];
  } catch (error) {
    console.error(`Error fetching msisdn: ${error}`);
    return ["Error getting msisdn NPFL"];
  }
}

const _npfl_insertIntoSmsSentFootballQuiz = async (
  msisdn,
  type_event,
  message_id,
  status
) => {
  try {
    const [ok] = await promise_pool.query(
      process.env.INSERT_INTO_FOOTBAL_SENT_NPFL,
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
}
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
}
