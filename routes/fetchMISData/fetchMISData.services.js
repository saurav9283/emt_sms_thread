const pool = require("../../database");
const poolPromotion = require("../../databasePromotion");

module.exports = {
  fetchSubData: (date, callback) => {
    const checkUserCount = process.env.checkUserCount.replace(
      "<SELECTDATE>",
      date
    );
    console.log("checkUserCount ", checkUserCount);
    pool.query(`${checkUserCount}`, [], (err, result) => {
      if (err) return callback(err);
      // console.log(result[0]);

      return callback(null, result[0]);
    });
  },
  fetchRevenue: (date, callback) => {
    const fetchSuccess = process.env.fetchSuccess.replace("<SELECTDATE>", date);
    console.log("fetchSuccess ", fetchSuccess);
    pool.query(`${fetchSuccess}`, [], (err, result) => {
      if (err) return callback(err);
      console.log(result);

      return callback(null, result);
    });
  },
  fetchTodaysCHarged: (callback) => {
    const todaysChargedNumbers = process.env.todaysChargedNumbers;
    pool.query(`${todaysChargedNumbers}`, [], (err, result) => {
      if (err) return callback(err);
      console.log(result[0]);
      return callback(null, result);
    });
  },
  deleteUser: (msisdn, callback) => {
    const insertSubChurn = process.env.insertSubChurn.replace(
      "<MSISDN>",
      msisdn
    );
    const deleteSubscription = process.env.deleteSubscription.replace(
      "<MSISDN>",
      msisdn
    );
    const DELETE_FORM_BILLING_ON_SUCCESS =
      process.env.DELETE_FORM_BILLING_ON_SUCCESS.replace("<MSISDN>", msisdn);
    pool.query(`${DELETE_FORM_BILLING_ON_SUCCESS}`, [], (err, result) => {
      if (err) {
        throw err;
      }
      pool.query(`${deleteSubscription}`, [], (err, result) => {
        if (err) {
          throw err;
        }
        return callback("", "Success");
      });
    });
  },
  checkUser: (msisdn, callback) => {
    const checkUserExist = process.env.checkUser.replace("<MSISDN>", msisdn);
    // console.log("checkUserExist ", checkUserExist);
    pool.query(`${checkUserExist}`, [], (err, result) => {
      if (err) throw err;
      return callback("", result);
    });
  },
  fetchPublisherHit: (date, callback) => {
    const fetchSent = process.env.fetchSent.replace("<SELECTDATE>", date);
    // console.log(fetchSent);
    poolPromotion.query(`${fetchSent}`, [], (err, result) => {
      if (err) throw err;
      return callback("", result);
    });
  },

  fetchPublisherNotHit: (date, callback) => {
    const fetchNotSent = process.env.fetchNotSent.replace("<SELECTDATE>", date);
    console.log(fetchNotSent);
    poolPromotion.query(`${fetchNotSent}`, [], (err, result) => {
      if (err) throw err;
      return callback("", result);
    });
  },
};
