var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
var cors = require("cors");
var cron = require("node-cron");
var app = express();
var cors = require("cors");
const { getToken } = require("./lib/authToken");
const { liveScoreSend } = require("./threads/liveMatchAlert");
const { getLiveMatchesForToday } = require("./goal alerts/liveFixtures");
const {
  getDailyMatches,
  getCurrentMatches,
} = require("./goal alerts/dailyFixtures");
const {
  upcomingMatchesThread,
  dailyMatchAlerts,
} = require("./threads/dailyUpcomingMatches");
const liveMatchAlert = require("./threads/liveMatchAlert");
const { sendLiveQuestions } = require("./threads/sendDailyQuestions");
const { getWeeklyFixtures } = require("./goal alerts/weeklyFixtures");
const { InstantReport } = require("./threads/instantThread");
const { _npflsendLiveQuestions } = require("./threads/sendDailyQuestionsNpfl");
const cp = require("child_process");
const { sendRewardToWinner } = require("./winner/winner.controller");

const event = require("events");
const { calculateRevenue } = require("./calculate");
const { sendCashToWinner } = require("./cashWinning/cash.controller");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3009",
      "http://icmtn.toon-flix.com",
      "http://www.icmtn.toon-flix.com",
      "http://localhost:3010",
      "http://videocentral.org",
    ],
  })
);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const sendWinnerJob = cron.schedule("0 0 18 * * *", () => {
  sendRewardToWinner(
    "Football Quiz",
    process.env.Football_winner_amount,
    "MTN"
  );
});

const instantWinnerJob = cron.schedule("0 0 18 * * *", () => {
  // reward instant game player
  sendRewardToWinner("Instant Game", process.env.Instant_winner_amount, "MTN");
});

sendWinnerJob.start();
instantWinnerJob.start();

// const sendCashWinnerJob = cron.schedule("*/1 * * * *", () => {
const sendCashWinnerJob = cron.schedule("0 0 18 * * *", () => {
  sendCashToWinner("Football Quiz", process.env.Cash_Price, "MTN");
});
const instantCashWinnerJob = cron.schedule("0 0 18 * * *", () => {
  sendCashToWinner("Instant Game", process.env.Cash_Price, "MTN");
});
const instantCashWinnerGloJob = cron.schedule("0 0 18 * * *", () => {
  sendCashToWinner("Instant Game", process.env.Cash_Price, "GLO");
});

sendCashWinnerJob.start();
instantCashWinnerJob.start();
instantCashWinnerGloJob.start();

var league = process.env.LEAGUE, // current leauge
  season = new Date().getFullYear(), // currrent year
  current_date = new Date().toISOString().split("T")[0];

// Get scores from rapid api and update in database
setInterval(async () => {
  getLiveMatchesForToday(league, season);
}, 30 * 1000);

const eventEmmiter = new event.EventEmitter();

// eventEmmiter.on("liveScore", liveScoreSend);

// eventEmmiter.emit("liveScore");
liveScoreSend();
sendLiveQuestions(); // for sending daily live questions
_npflsendLiveQuestions(); // npfl daily questions
// dailyMatchAlerts(); // alert for daily matches ->
InstantReport();

// get daily and upcoming matches
// LEAGUE is 39 season is 2024 and current Date
setInterval(
  async () => {
    getDailyMatches(league, season, current_date);
  },
  3 * 60 * 60 * 1000 // every 6 hourss
  // 60 * 1000 // every 6 hourss
);

// getting today matches -> working hai
setInterval(async () => {
  getCurrentMatches(league, season, current_date);
}, 1 * 60 * 1000);

app.use(express.static(path.join(__dirname, "footballadmin")));

app.get("/api/reboot", (req, res) => {
  process.exit(1);
  res.send("reboot successfully");
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "footballadmin", "index.html"));
});

const services = ["Football", "Instant", "Goal", "Video", "NPFL", "Game Box"];

const job1 = cron.schedule("0 */3 * * *", () => {
  for (let i = 0; i < services.length; i++) {
    setTimeout(() => calculateRevenue(services[i]), 1000);
  }
});

job1.start();

const job2 = cron.schedule("0 0 5 * * *", () => {
  console.log("restarting...");
  process.exit(1);
});

job2.start();

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

process.on("uncaughtException", function () {
  process.exit(1);
});

module.exports = app;
