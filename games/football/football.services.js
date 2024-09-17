const { promise_pool } = require("../../database");
const { upadteUserPoints } = require("../../services/sms.services");

module.exports = {
    
    insertIntoTableAnswer: async (
        msisdn,
        questionId,
        correctOption
    ) => {
        try {
            const [ok] = await promise_pool.query(
                process.env.INSERT_INTO_TABLE_ANSWERS,
                [
                    msisdn,
                    questionId,
                    correctOption
                ]
            );
            return [null, "Insserted into tbl answer successfully"]
        } catch (e) {
            console.log(
                e, "IN CORRECT OPTION ID ->"
            );
            return [e]
        }
    },

    insertIntoUserAnswerLogs: async (
        msisdn,
        questionId,
        correct_option,
        type_event,
        trxid
    ) => {
        try {
            const [ok] = await promise_pool.query(
                process.env.INSERT_INTO_TABLE_ANSWERS_LOGS,
                [
                    msisdn,
                    questionId,
                    correct_option,
                    type_event,
                    trxid
                ]
            );
            return [null, "Inserted into answers logs"]
        } catch (e) {
            console.log(
                e, "IN INSERT ANSWER LOGS"
            );
            return [e]
        }
    },
    compareAnswers: async (msisdn, answer) => {
      try {
        const [reslts] = await promise_pool.query(
            process.env.COMPARE_ANSWERS_QUERY,
            [
                msisdn, 
                answer
            ]
        );
        return [null, reslts[0].CORRECT];

      } catch (e) {
        console.log(
            e, "IN COMPARE ANSWERS"
        )
        return [e];
      }
    },
    updateAnswersLogs: async (msisdn, matched) => {

        let UPDATE_USER_LOGS_QUERY = 
            process.env.UPDATE_ANSWER_LOGS
            .replace(
                '<MATCHED>',
                Number(matched) === 1 ? "yes" : "no"
            )
            .replace("<MSISDN>", msisdn);
        
        console.log("ANS_LOGS ->", UPDATE_USER_LOGS_QUERY);

        try {   
            const [ok] = await promise_pool.query(
                UPDATE_USER_LOGS_QUERY
            );
            return [null, "Updated user answer logs"];
        } catch (e) {
            console.log(
                e, "IN UPDATE ANSWER LOGS"
            );
            return [e];
        }
    },
    checkPendingAnswersLog: async (
        msisdn,
    ) => {
        try{
            const [row] = await promise_pool.query(
                process.env.GET_PENDING_ANSWERS,
                [
                    msisdn,
                ]
            );
            return [null, row]

        } catch (e) {
            console.log(
                e, "IN CHECK PENDING ANSWERS"
            );
            return [e]
        }
    },
    insertUserAllLogs: async (
        msisdn,
        q_id_1,
        answer1,
        matched1,
        q_id_2,
        answer2,
        matched2,
        type_event,
    ) => {
        try {
            const [ok] = await promise_pool.query(
                process.env.INSERT_INTO_USER_ANSWER_LOGS,
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
            return [null, "Inserted into user answers logs session closed"]
        } catch (e) {
            console.log(
                e, "IN INSERT USER ANSWERS LOGS ->"
            )
            return [e]
        }
    },
    deleteFormTblAnsLogs: async (msisdn) => {
        try {
            const [ok] = await promise_pool.query(
                process.env.DELETE_FROM_TBL_ANSWER_LOGS,
                [
                    msisdn
                ]
            );
            return [null, "Done deleting from tbl ans logs"]
        } catch (e) {
            console.log(
                e, "ERROR IN DELETING ANS LOGS ->"
            );
            return [e]
        }
    },
    deleteFormTblAns: async (msisdn) => {
        try {
            const [ok] = await promise_pool.query(
                process.env.DELETE_FROM_TBL_ANS,
                [
                    msisdn
                ]
            );
            return [null, "Done deleting from tbl ans logs"]
        } catch (e) {
            console.log(
                e, "ERROR IN DELETING ANS LOGS ->"
            );
            return [e]
        }
    },
    deleteOnSmsExpire: async (msisdn) => {    
        try {
            const [ok] = await promise_pool.query(
                process.env.DELETE_ON_ANSWER_EXPIRE,
                [
                    msisdn
                ]
            );
            return [null, "Delete on sms expire"]
        } catch (e) {
            console.log(e)
            return ["Failed to delete from logs on time expire ->"]
        }
    },
    handelSms : (fist, second, points, message) => {
      let sms_type;

      if (!fist && !second) {
        return sms_type = SMS_PREFIX + " " +  message;
      }

      if (!second) {
        if (fist.matched === "yes") {
          // first answer is corret
          return sms_type = one_correct.replace("<POINTS>", points) + " " +  message;
        } else {
          // first is incorrect
          return sms_type = one_incorrect.replace("<POINTS>", points) + " " +  message;
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
          console.log("SECOND ->")
          sms_type = second_correct.replace("<POINTS>", points);
          break;

        default:
          console.log("second failed")
          sms_type = tomorow;
          break;
      }
      return sms_type
    },
}


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
Reply with MORE to earn more
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
Reply with MORE too earn more
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
Reply with MORE too earn more
points and stand a better chance
of winning cash prizes and
airtime. You will be charged
N50/Game
`;

var tomorow = `
Sorry, let's try again tomorrow. You can also gather more points by sending PLAY to 20782
`;