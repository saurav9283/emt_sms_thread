const { sendSms } = require("../../lib/sendSms");
const {
  _npfl_getRandomWelcomeQuestion,
  _npfl_insertUserPoints,
  _npfl_handelSms,
  _npfl_insertIntoUserAnswerLogs,
  _npfl_insertIntoTableAnswer,
  _npfl_compareAnswers,
  _npfl_updateAnswersLogs,
  _npfl_checkPendingAnswersLog,
  _npfl_upadteUserPoints,
  _npfl_checkExistingPoints,
  _npfl_insertUserAllLogs,
  _npfl_deleteFormTblAnsLogs,
} = require("./npfl.football.services");

module.exports = {
  npflFootballHandler: async (callback, res) => {
    // console.log("npfl request =>", req.body);
    const {
      senderAddress,
      message,
      network,
      aggregator,
      id,
      receiverAddress,
      created,
      trxid,
      pisisid,
      msisdn,
      updatetype,
    } = callback;

    let ani = msisdn || senderAddress;

    if (updatetype == "deletion") return false;
    // get new sms params that has next question to send to the user
    const [paramsError, smsParams] = await _npfl_getRandomWelcomeQuestion(ani);

    if (paramsError) return console.log("ERROR IN SMS PARAMS", paramsError);

    if (updatetype == "addition") {
      // handle sms for first time subscriber
      _npfl_insertUserPoints(ani);

      const sms = _npfl_handelSms(null, null, null, smsParams.message);
      console.log("sms to send =>", sms);
      // sub
      smsHandler(ani, trxid, pisisid, sms);

      console.log("ADDING QUESTION ->");
      // for logs
      await _npfl_insertIntoUserAnswerLogs(
        ani,
        smsParams.id, // question id
        smsParams.correct_option, // correct option
        "SUB",
        trxid
      );
      // for compare
      await _npfl_insertIntoTableAnswer(
        ani,
        smsParams.id, // question id
        smsParams.correct_option // correct option
      );
      return res.send("OK");
    } else if (updatetype === "charged") {
      console.log("Logic begin =>");
      _npfl_insertUserPoints(ani);
      console.log("Reached =>");
      console.log("Tis is sms params =>", smsParams);
      await smsHandler(msisdn, trxid, pisisid, smsParams.message);

      await _npfl_insertIntoUserAnswerLogs(
        ani,
        smsParams.id, // question id
        smsParams.correct_option, // correct option
        "MORE",
        trxid
      );
      // for compare
      await _npfl_insertIntoTableAnswer(
        ani,
        smsParams.id, // question id
        smsParams.correct_option // correct option
      );
      return res.send("OK");
    }

    // compare answers comparision
    const [e4, matched] = await _npfl_compareAnswers(ani, message);

    console.log(matched, "ANSWER MATCHED FOR -> ", [ani]);
    // update if answer is correct or not
    const [e5, updatedAnsLogs] = await _npfl_updateAnswersLogs(ani, matched);

    console.log(updatedAnsLogs);
    // check pending answer and previous question
    const [e1, userLogs] = await _npfl_checkPendingAnswersLog(ani);

    // update use points here
    if (userLogs[0]?.matched === "yes" || userLogs[1]?.matched === "yes") {
      await _npfl_upadteUserPoints(ani);
    }

    // console.log(userLogs);
    const [poinstError, point] = await _npfl_checkExistingPoints(ani);

    console.log("GOT POINTS ->", [point, ani]);
    // get sms prefix based on the user previous attempts

    if (userLogs[0].type_event == "MORE") {
      let smsTosend = "";
      console.log("TYPE EVENT IS MORE ->", [ani]);
      if (userLogs[0]?.matched === "yes") {
        // correct answer
        // upadteUserPoints(ani);
        smsTosend += `Congratulations! You've earned ${point.points} points and qualified for today's draw. You will be notified of the result by SMS.Reply with PLAYQ to earn more points and stand a better chance of winning cash prizes and airtime. You will be charged N50/Game`;
      } else {
        // not correct answer
        smsTosend += `oops, you've failed again.\nReply with PLAYQ to earn more points and stand a better chance of winning cash prizes and airtime.\nYou will be charged N50/Game.`;
      }

      smsHandler(ani, trxid || userLogs[0].trxId, pisisid, smsTosend);

      const [ex, result] = await _npfl_insertUserAllLogs(
        ani,
        userLogs[0].q_id,
        userLogs[0].answer,
        userLogs[0].matched,
        "0",
        "0",
        "0",
        userLogs[0].type_event
      );

      const [ey, deleted] = await _npfl_deleteFormTblAnsLogs(ani);
      console.log([result, deleted]);
      return res.send("OK");
    }

    const sms = _npfl_handelSms(
      userLogs[0],
      userLogs[1],
      point.points,
      smsParams.message
    );

    smsHandler(ani, trxid || smsParams.SMS_ID, pisisid, sms);

    if (userLogs[0] && userLogs[1]) {
      if (userLogs[1].isPending === "no") {
        // all question asked
        let first = userLogs[0],
          second = userLogs[1];

        const [ex, result] = await _npfl_insertUserAllLogs(
          ani,
          first.q_id,
          first.answer,
          first.matched,
          second.q_id,
          second.answer,
          second.matched,
          first.type_event
        );

        const [ey, deleted] = await _npfl_deleteFormTblAnsLogs(ani);
        console.log([result, deleted]);
      }
      console.log("all questions asked ->");
      // on all question answerd
    } else {
      console.log("ADDING QUESTION ->");
      // for logs
      _npfl_insertIntoUserAnswerLogs(
        ani,
        smsParams.id, // question id
        smsParams.correct_option, // correct option
        userLogs[0].type_event,
        trxid
      );
      // for compare
      _npfl_insertIntoTableAnswer(
        ani,
        smsParams.id, // question id
        smsParams.correct_option // correct option
      );
    }
    return res.send("OK");
  },
};

async function smsHandler(msisdn, trxid, pisisid, sms) {
  return new Promise(async (resolve, reject) => {
    console.log("Inside sms handler =>");
    var smsPayload = {
      pisisid: String(pisisid),
      msisdn,
      message: sms,
      trxid: trxid,
    };

    console.log({ smsPayload });
    // sending user sms
    const [smsError] = await sendSms(smsPayload);
    console.log({ smsError });
    if (!smsError) return resolve("ok");
    // sms sended successfully so insert into user session
    return resolve("SMS ERROR");
  });
}
