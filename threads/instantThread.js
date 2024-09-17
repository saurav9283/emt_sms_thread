const { promise_pool } = require("../database");
const {
  insertIntoInstantLogs,
  deleteFromInstantLogs,
  deleteFromInstantSessionNew,
  updateInstantSession,
  updateUserPlayLimit
} = require("../games/instantGame/instant.services");
const { sendSms } = require("../lib/sendSms");

module.exports = {
  InstantReport: async () => {
    while (true) {
      await instanThreadHandler();
      await sleep(50);
    }
  },
};

async function instanThreadHandler() {
  const [e1, pendingMsisdn] = await pickInstantReportNumbers();
  if (e1 || pendingMsisdn.length === 0) {
    console.log(e1, "Instant Pending Msisdn length =>", pendingMsisdn.length);
    console.log("sleeping instant thread for 2 hours =>");
    await sleep(1 * 60 * 60);
    return false;
  }
  console.log("hereeeeee")
  var sms =
    'NGN <NO1> NGN <NO2> NGN <NO3> You need match three amounts to win. Please try again! you can PLAY more by sending "MORE" to 20781.';
  const pendingNotification = pendingMsisdn.map(async (item) => {
    // getting random numbers
    const randomNumbers = [];
    for (let i = 0; i < 3; i++) {
      randomNumbers.push(Math.floor(1000 + Math.random() * 3001));
    }
    console.log(item)
    var smsPayload = {
      pisisid: "176",
      msisdn: item.msisdn,
      message: sms
        .replace("<NO1>", randomNumbers[0])
        .replace("<NO2>", randomNumbers[1])
        .replace("<NO3>", randomNumbers[2]),
      trxid: getTrxId(),
    };
   console.log(smsPayload.message);
    // sending user sms
    const [smsError, success] = await sendSms(smsPayload);
     if (smsError) {
       return `[error]_Instant sms api => ${smsError.message}`;
    }
    var [ee, ok11] = await updateInstantSession(
      item.msisdn,
      "thread",
      false,
      {randomNumbers}
    );
    if(ee) return `[error]_Instant => ${e2}`;
    const [limitErr, limitReseted] = await updateUserPlayLimit(
      item.msisdn,
      0
    );
    if(limitErr) return `[error]_Instant => ${limitErr}`;
    var [e2, ok2] = await insertIntoInstantLogs(item.msisdn);
    // console.log(e2, "e2");
    if (e2) return `[error]_Instant => ${e2}`;
    const [e3, ok3] = await deleteFromInstantSessionNew(item.msisdn);
    if (e3) return `[error]_Instant => ${e3}`;
    return `[success]_Instant => ${item.msisdn}`;
  });
  const results = await Promise.all(pendingNotification);
  console.log("[info]_Instant_result =>", results);
  return true;
}

async function pickInstantReportNumbers() {
  try {
    const [rows] = await promise_pool.query(
      process.env.pickPendingInstantReportMsisdn
    );
    return [null, rows];
  } catch (e) {
    console.log(e);
    return [e];
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
}

function getTrxId() {
  let str = 'qwertyuiopasdfghjklzxcvbnm1234567890';
  let uuid = '';
  for (let i = 0; i < 10; i++) {
    uuid += str.charAt(Math.floor(Math.random() * str.length));
  }
  return uuid;
}