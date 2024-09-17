const { promise_pool } = require("../../database");
const { getToken } = require("../../lib/authToken");
const { sendSms } = require("../../lib/sendSms");
const {
  updateInstantLosg,
  insertIntoInstantLogs,
  deleteFromInstantLogs,
  insertIntoInstantSession,
  insertInstantGameLogs,
  getCurrentRevenue,
  getTrxid,
  checkifInstantSessionExist,
  insertIntoTblWinner,
  getCurrentDayWinner,
} = require("./instant.services");

const instantGameHandler = async (callback, res) => {
  console.log("Inside instant game");

  const {
    msisdn,
    senderAddress,
    message,
    trxid,
    pisisid,
    pisipid,
    updateType,
  } = callback;

  //  if msisdn is undefiend then sender address have the msisdn
  let ani = msisdn || senderAddress;

  // console.log(ani, { msisdn, senderAddress });

  const threshold = 1000000;

  const [e0, current_winner] = await getCurrentDayWinner();
  if (e0) return [e0];

  const [e1, total_revenue] = await getCurrentRevenue();

  if (e1) return [e1];

  let s1, trxids;

  if (!trxid) {
    [s1, trxids] = await getTrxid(ani);
  }

  console.log("current_revenue amount ->", total_revenue);
  console.log("today winner no ->", current_winner);
  let selectedNumber;

  if (total_revenue >= threshold && current_winner[0]?.WINNER <= 0) {
    // win response

    const numbersToChooseFrom = [1000, 2000, 3000];

    selectedNumber =
      numbersToChooseFrom[
        Math.floor(Math.random() * numbersToChooseFrom.length)
      ];

    console.log("WIN", [ani]);

    instantGameSmsHandler(
      ani,
      trxid || trxids,
      pisisid,
      pisisid,
      "WIN",
      WIN_REPONSE.replace("<NO1>", selectedNumber)
        .replace("<NO2>", selectedNumber)
        .replace("<NO3>", selectedNumber)
    );
    let airtime = "0";
    // insert into winners
    const [ex, ok0] = await insertIntoTblWinner(ani, airtime, "WINNER");
    console.log([ex, ok0]);

    const [e0, exist] = await checkifInstantSessionExist(ani);
    if (exist) {
      const [e1, ok1] = await updateInstantLosg(ani, "0");
      console.log(ok1);
      var [e2, ok2] = await insertIntoInstantLogs(ani);
      console.log(ok2);
      const [e3, ok3] = await deleteFromInstantLogs(ani);
      console.log(ok3);
    } else {
      // for type more
      insertInstantGameLogs(
        ani,
        trxid || trxids,
        pisisid,
        pisipid,
        updateType || message,
        "1"
      );
    }
  } else {
    // not win response
    const randomNumbers = [];
    for (let i = 0; i < 3; i++) {
      randomNumbers.push(Math.floor(1000 + Math.random() * 3001));
    }
    console.log(
      `Current total sales: ${total_revenue}. Three random 4-digit numbers: ${randomNumbers.join(
        ", "
      )}`
    );

    console.log("Not Win", [ani]);

    instantGameSmsHandler(
      ani,
      trxid || trxids,
      pisisid,
      pisipid,
      "WIN",
      NOT_WIN_RESPONSE.replace("<NO1>", randomNumbers[0])
        .replace("<NO2>", randomNumbers[1])
        .replace("<NO3>", randomNumbers[2])
    );

    const [e0, exist] = await checkifInstantSessionExist(ani);
    if (exist >= 1) {
      console.log("USER SESSION EXIST ->");
      const [e1, ok1] = await updateInstantLosg(ani, "0");
      console.log(ok1);
      var [e2, ok2] = await insertIntoInstantLogs(ani);
      console.log(ok2);
      const [e3, ok3] = await deleteFromInstantLogs(ani);
      console.log(ok3);
    } else {
      console.log("USER SESSION NOT EXIST ->");
      // for type more and to create session
      insertInstantGameLogs(
        ani,
        trxid || trxids,
        pisisid,
        pisipid,
        updateType || message,
        "0"
      );
    }
  }
};

async function instantGameSmsHandler(
  msisdn,
  trxid,
  pisisid,
  pisipid,
  type,
  response
) {
  return new Promise(async (resolve, reject) => {
    const [tokenError, authToken] = await getToken();

    if (tokenError) {
      console.log("GOT TOKEN ERROR", tokenError);
    }

    let messageTosend = response ? response : handleSmsType(pisipid);

    console.log("MESSAGE TO SEDN", messageTosend);

    var smsPayload = {
      pisisid: String(pisisid),
      msisdn,
      message: messageTosend,
      trxid: trxid,
    };
    console.log(smsPayload);
    // sending user sms
    const [smsError] = await sendSms(smsPayload, authToken);
    console.log(smsError);

    if (!smsError) {
      // sms sended successfully so insert into user session
      resolve("OK");
      // inserting user poinnt -> 10
    } else {
      resolve("null");
    }
  });
}

function handleSmsType(type) {
  console.log({ type });
  switch (type) {
    case 350:
      return economy;

    case 351:
      return diva;

    case 352:
      return MAX;

    case 353:
      return WEEKLY;

    default:
      return "";
  }
}

var economy =
  'Welcome: Welcome to Instant Game Economy, Play now and get rewarded instantly. Reply with "WIN" or "PLAY" to reveal your matching numbers. You get 1 GAME play today. Good luck!';
var diva =
  'Welcome: Welcome to Instant Game Diva, Play now and get rewarded instantly. Reply with "WIN" or "PLAY" to reveal your matching numbers. You get 2 GAME plays today. Good luck!';
var MAX =
  'Welcome: Welcome to Instant Game Max, Play now and get rewarded instantly. Reply with "WIN" or "PLAY" to reveal your matching numbers. You get 3 GAME plays today. Good luck!';

var WIN_REPONSE =
  "NGN <NO1> NGN <NO2> NGN <NO3>-Congrats you won NGN 100 000 Cash!  Your winnings will be deposited into your account.";

var NOT_WIN_RESPONSE =
  "NGN <NO1> NGN <NO2> NGN <NO3> You need to match three amounts to win. Please try again! you can PLAY more by sending 'MORE' to 20781.";

var WEEKLY =
  'Welcome to Instant Game Weekly! Play now and get rewarded instantly. Reply with "WIN" or "PLAY" to reveal your matching numbers. You get 2 game plays per day for 7days. Good luck!';

module.exports = {
  instantGameHandler,
  instantGameSmsHandler,
};
