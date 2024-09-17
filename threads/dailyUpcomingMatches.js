const {
  getTodayMatchFromDb,
  getMsisdnForCurrrentMatchAlert,
  insertIntoSmsSent,
} = require("../goal alerts/goal.alert.services");
const { getTeamAbbreviation } = require("../goal alerts/teamAbbreviation");
const { sendSms } = require("../lib/sendSms");

module.exports = {
  dailyMatchAlerts: async () => {
    for (let i = 0; i <= Infinity; i++) {
      await getDailyMatches();
      await sleep(10);
    }
  },
};

async function getDailyMatches() {
  console.log(
    "--------------------------- SENDING DAILY MATCH ALERT -------------------------------"
  );
  const [e1, matches] = await getTodayMatchFromDb();
  // check error
  if (e1) {
    console.log("NO TODAYS MATCH MATCHES ->");
    return false;
  }
  if (matches.length === 0) {
    console.log("No matches today ->", [matches.length]);
    console.log("sleep for 6 hours => ")
    await sleep(6 * 60 * 60);
    return false;
  }
  // there are matches
  console.log("TODAY MATCHES ->", matches.length);
  let sms = "";
  matches.map((item) => {
    const HometeamAbbreviation = getTeamAbbreviation(item.homeTeam);
    const AwayTeamAbbrevation = getTeamAbbreviation(item.awayTeam);
    const parsedDate = new Date(item.date).toISOString().split("T")[0];

    return sms += `
      PL Schedule for ${parsedDate} (UTC Time)
      ${HometeamAbbreviation} vs ${AwayTeamAbbrevation}: ${item.time}
      Stay tuned for updates!
      `;
  });

  const [e3, pendingMsisdn] = await getMsisdnForCurrrentMatchAlert();

  if (e3) {
    console.log("error getting pending msisdns ->", e3);
  }
  if (pendingMsisdn.length === 0) {
    console.log("sleep for 6 hours => ")
    await sleep(6 * 60 * 60);
    return console.log("NO PENDING SUBSCRIBER FOR DAILY MATCH ALERT->");
  }

  const notificationPromises = pendingMsisdn.map(async (item) => {
    const smsPayload = {
      pisisid: process.env.GOAL_ALERT_PISISID,
      msisdn: item.msisdn,
      message: sms,
      trxid: item.trxid,
    };

    // console.log("SMS PAYLOAD FOR DAILY MATCH ALERT ->", sms[0].message);
    console.log(smsPayload);
    const [smsError, smsSuccess] = await sendSms(smsPayload);
    // console.log(smsError);
    if (smsError) {
      return { smsError, smsSuccess };
    }
    await insertIntoSmsSent(
      item.msisdn,
      item.trxid,
      item.type_event,
      "",
      "GOAL_ALERT",
      sms,
      JSON.stringify(smsPayload),
      JSON.stringify(smsError || smsSuccess),
      "DAILY_ALERT"
    );
    return { smsError, smsSuccess };
  });
  const results = await Promise.all(notificationPromises);
  console.log(results);
  return results;
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms * 1000);
  });
}
