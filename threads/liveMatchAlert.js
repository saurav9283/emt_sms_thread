const { promise_pool } = require("../database");
const {
  getLiveScore,
  getPendingMsisdnForGoalNews,
  getRandomGoalAlertNews,
  insertIntoSmsSent,
  insertMsidnForGoalNwes,
  updateLiveMatchStatus,
  insertIntoLiveAlertSent,
  updateSmsPending,
  insertIntoSmsSentGoalNews,
} = require("../goal alerts/goal.alert.services");
const { getTeamAbbreviation } = require("../goal alerts/teamAbbreviation");
const { sendSms } = require("../lib/sendSms");

module.exports = {
  liveScoreSend: async () => {
    for (let i = 0; i <= Infinity; i++) {
      // Replace the infinite loop with a controlled loop.
      const [error, liveScore] = await getLiveScore();

      console.log("started live matches ->", [liveScore.length]);
      if (liveScore.length === 0) {
        // send daily new
        // await insertMsidnForGoalNwes();
        await sendDailyNews();
        await sleep(40);
        // return;
      } else {
        console.log("no of live matches ->", liveScore.length);
        for (let i = 0; i < liveScore.length; i++) {
          await sendLiveScores(liveScore[i]);
          await sleep(30);
        }
        await sleep(20);
      }
    }
  },
};
// send daily news when no live match
async function sendDailyNews() {
  const [e0, pending] = await getPendingMsisdnForGoalNews();
  if (e0 || pending.length === 0) {
    console.log(`no news => `, pending.length);
    console.log("sleep for 1 hours=>");
    //await sleep(1 * 60 * 60);
    return false;
  } else {
    // got pending number
    const notificationPromises = pending.map(async (item) => {
      const [e0, news] = await getRandomGoalAlertNews(item.msisdn);
      if (e0 || !news) {
        return `[info]_goal no news => ${item.msisdn}`;
      }
      const smsPayload = {
        pisisid: process.env.GOAL_ALERT_PISISID,
        msisdn: item.msisdn,
        message: news.message,
        trxid: item.trxid,
      };
      const [smsError, smsSuccess] = await sendSms(smsPayload);
      if (smsError) {
        //console.log(smsError)
        return `[error]_goal => ${item.msisdn} : ${smsError.message}`;
      }
      await insertIntoSmsSentGoalNews(
        item.msisdn,
        item.type_event,
        news.id,
        "GOAL_ALERT_NEWS"
      );
      return `[success]_goal => ${item.msisdn}`;
    });
    const done = await Promise.all(notificationPromises);
    console.log("goal result =>", done.length);
    return done;
  }
}

async function sendLiveScores(liveScore) {
  try {
    const {
      fixture_id,
      halfTime,
      fullTime,
      penalty,
      winner,
      homeTeam,
      awayTeam,
      matchStatus,
      time,
      date,
    } = liveScore;
    const formatedDate = new Date().toISOString().split("T")[0];
    const teamAbbreviationHome = getTeamAbbreviation(homeTeam);
    const teamAbbreviationAway = getTeamAbbreviation(awayTeam);
    console.log("formated date ->", formatedDate);
    // sms responses -> -> -> -> -> ->- >-> ->
    const live = `
      PL Live Updates
      (H) ${teamAbbreviationHome} vs ${teamAbbreviationAway} (A)
      Kick-off: ${time} UTC
      ${halfTime}
      ${fullTime}
      ${penalty}
      Status: LIVE
      Stay tuned for more live updates!
    `;
    const postPoned = `
    PL Live Updates (${formatedDate})
    (H) ${teamAbbreviationHome} vs ${teamAbbreviationAway} (A)
    Kick-off: ${time} UTC
    ${halfTime}
    ${fullTime}
    ${penalty}
    Status: ${matchStatus}
    Stay tuned for more live updates!
    `;
    const matchFinished = `
    PL Match Result (${formatedDate})
    (H) ${teamAbbreviationHome} vs. ${teamAbbreviationAway} (A)
    Kick-off: ${time} UTC
    ${halfTime}
    ${fullTime}
    Status: Match Finished (FT)
    ${getTeamAbbreviation(winner)} won!
    Stay tuned for more!
    `;

    const matchDraw = `
    PL Match Result (${formatedDate})
    (H) ${teamAbbreviationHome} vs. ${teamAbbreviationAway} (A)
    Kick-off: ${time} UTC
    ${halfTime}
    ${fullTime}
    Status: ${winner}!
    Stay tuned for more!
    `;

    const penalty_sms = `
    PL Match Result (${formatedDate})
    (H) ${teamAbbreviationHome} vs. ${teamAbbreviationAway} (A)
    Kick-off: ${time} UTC
    ${halfTime}
    ${fullTime}
    ${penalty}
    Status: Finished (PN)
    ${getTeamAbbreviation(winner)} won!
    Stay tuned for more!
    `;

    let sms = "";
    if (matchStatus == "Match Postponed") {
      sms = postPoned;
    } else if (matchStatus == "Match Finished" && penalty.includes("0")) {
      sms = matchFinished;
    } else if (matchStatus == "Match Finished" && isPenality(penalty)) {
      sms = penalty_sms;
    } else if (matchStatus == "Match Finished" && winner == "Draw") {
      // got draw
      sms = matchDraw;
    } else {
      sms = live;
    }

    const [error1, pendingSubscribers] = await getAllMsisdn(fixture_id);

    if (error1) {
      console.error(`Error fetching subscribers: ${error1}`);
      return;
    }

    console.log(
      "pending number to send live score ->",
      pendingSubscribers.length
    );
    if (pendingSubscribers.length > 0) {
      // Notify all pending subscribers
      const notificationPromises = pendingSubscribers.map(
        async ({ msisdn, trxid, id }) => {
          const smsPayload = {
            msisdn,
            trxid,
            pisisid: process.env.GOAL_ALERT_PISISID,
            message: sms,
          };
          // sending sms now
          const [smsError, success] = await sendSms(smsPayload);
          console.log(smsError);
          if (smsError) {
            return `[error]_live_alert => ${msisdn} : ${smsError.message}`;
          }
          if (
            matchStatus == "Match Finished" ||
            matchStatus == "Match Postponed"
          ) {
            // console.log(fixture_id)
            await insertIntoLiveAlertSent(msisdn, fixture_id, sms);
            // console.log(fixture_id)
          }
          await updateSmsPending(id);
          await sleep(1);
          return `[success]_live_alert => ${msisdn}`;
        }
      );

      const results = await Promise.all(notificationPromises);
      console.log(results);
      return true;
    } else {
      // console.log("No subscriptions to send goal alerts.");
      return false;
    }
  } catch (e) {
    console.error(`Error in sendLiveScores`, e);
    return false;
  }
}

async function getAllMsisdn(fixture_id) {
  console.log("FIX ID IS ", fixture_id);

  try {
    const [rows] = await promise_pool.query(
      process.env.PICK_SMS_TO_SEND_GOAL_ALERT.replace(
        "<FIXTURE_ID>",
        fixture_id
      )
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

// to check for penelaty ->
function isPenality(textString) {
  let count = 0;
  for (let char of textString) {
    if (char === "0") {
      count++;
    }
  }
  return count === 2 ? false : true;
}
