const { promise_pool } = require("../database");

const {
  insertIntoUserAnswerLogs,
  insertIntoTableAnswer,
} = require("../games/football/football.services");
const { insertIntoSmsSent, insertIntoSmsSentFootballQuiz } = require("../goal alerts/goal.alert.services");
const { sendSms } = require("../lib/sendSms");
const {
  getRandomWelcomeQuestion,
  deleteFormSmsPending,
} = require("../services/callback.services");

module.exports = {
  sendLiveQuestions: async () => {
    while (true) {
      await sendQuestions();
      await sleep(5);
    }
  },
};

async function sendQuestions() {
  console.log("processing football =>");
  try {
    const [error1, pendingSubscribers] = await getAllMsisdn();

    if (error1) {
      console.error(error1);
      return `Error fetching subscribers: ${error1}`;
    }
    console.log("Pending football SMS =>", pendingSubscribers.length);

    if (pendingSubscribers.length > 0) {
      const pendingResults = pendingSubscribers.map(async (sub) => {
        try {
          const { msisdn, trxid, service, type_event } = sub;
          const [paramsError, smsParams] = await getRandomWelcomeQuestion(msisdn);
          console.log('smsParams:=-=-=-=-=- ', smsParams);
          if (paramsError) {
            return `param error => ${msisdn}`;
          }
          const sms = smsParams.message;
          // console.log('sms: ', sms);
          const smsPayload = {
            pisisid: process.env.FOOTBALL_PISISID,
            msisdn,
            message: sms,
            trxid,
          };
          const [smsError, success] = await sendSms(smsPayload);
          // console.log('success: ', success);
          if (smsError) {
             return `[error]_quiz => ${msisdn} : ${smsError.message}`;
          }
          await insertIntoUserAnswerLogs(
            msisdn,
            smsParams.id,
            smsParams.correct_option,
            type_event,
            trxid
          );

          await insertIntoTableAnswer(
            msisdn,
            smsParams.id,
            smsParams.correct_option
          );

          const [e0, saved] = await insertIntoSmsSentFootballQuiz(
            msisdn,
            type_event,
            smsParams.id,
            'FOOTBALL_QUIZ'
          );
          if (e0) {
            throw new Error(`Error inserting SMS sent logs: ${e0}`);
          }
          const [e1, ok] = await deleteFormSmsPending(msisdn, service);
          if (e1) {
            throw new Error(`Error deleting pending SMS: ${e1}`);
          }
          return `[success]_quiz => ${msisdn}`;
        } catch (err) {
          console.error(`Error processing subscriber ${sub.msisdn}:`, err);
          return `Error processing subscriber ${sub.msisdn}: ${err.message}`;
        }
      });
      const result = await Promise.all(pendingResults);
      console.log(result);
      return result;
    } else {
      console.log('sleeping for 2 hours, football =>');
      return await sleep(2 * 60 * 60);
    }
  } catch (e) {
    console.error(`Error in sending quiz questions:`, e);
    return `Error in sending quiz questions: ${e.message}`;
  }
}


async function getAllMsisdn() {
  try {
    const [rows] = await promise_pool.query(
      process.env.PICK_MSISDN_FOR_FOOTBALL
    );
    return [null, rows];
  } catch (error) {
    console.error(`Error fetching msisdn: ${error}`);
    return ["Error getting msisdn"];
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
}
