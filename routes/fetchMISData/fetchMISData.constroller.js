const {
  fetchSubData,
  fetchRevenue,
  fetchTodaysCHarged,
  deleteUser,
  checkUser,
  fetchPublisherHit,
  fetchPublisherNotHit,
} = require("./fetchMISData.services");

module.exports = {
  fetchDataMIS: (req, res) => {
    const { date } = req.query;

    fetchSubData(date, (err, result) => {
      if (err) {
        throw err;
      }
      fetchRevenue(date, (err, resultRevenue) => {
        if (err) throw err;
        fetchTodaysCHarged((err, resultToday) => {
          fetchPublisherHit(date, (err, resultHit) => {
            if (err) throw err;
            fetchPublisherNotHit(date, (err, resultNotHit) => {
              if (err) throw err;
              // let resultRevenueAppend = resultRevenue.map((item, index) => ({
              //   ...item,
              //   ["sent"]: resultHit[0].sent,
              //   ["notsent"]: resultNotHit[0].NotSent,
              // }));

              let resultRevenueAppend = resultRevenue.map((item, index) => {
                if (index === 0) {
                  // Insert the first key-value pair into the first object
                  return {
                    ...item,
                    ["sent"]: resultHit[0].sent,
                    ["notsent"]: resultNotHit[0].NotSent,
                  };
                } else if (index === 1) {
                  // Insert the second key-value pair into the second object
                  return {
                    ...item,
                    ["notsent"]: resultNotHit[0].NotSent,
                    ["sent"]: resultHit[0].sent,
                  };
                }
                // For other objects, return them as is
                return item;
              });
              return res.json({
                subscription: result.CNT,
                revenue: resultRevenueAppend,
                resultToday: resultToday[0].charged,
              });
            });
          });
        });
      });
    });
  },
  deactivateUser: (req, res) => {
    const { msisdn } = req.query;
    checkUser(msisdn, (err, result) => {
      console.log(result);
      if (err)
        return res
          .status(400)
          .json({ result: 0, message: "Some thing went wrong" });

      if (result.length <= 0) {
        return res
          .status(400)
          .json({ result: result, message: "User Doesnt not exist" });
      } else {
        deleteUser(msisdn, (err, result) => {
          if (err) throw err;
          return res.json({
            result: result,
            message: "User Deactivated successfully",
          });
        });
      }
    });
  },
};
