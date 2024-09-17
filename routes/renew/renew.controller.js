const { promotionHandler } = require("../../service/promotion.services");
const util = require("util");
const {
  deleteFromPaymentSuccess,
  insertIntoBillingLogs,
  paymentSuccess,
  insertIntoBillingSuccess,
  updateBillingOnFail,
  updateTableSubscription,
  insertIntoBillingFailed,
  updateSubscriptionOnSuccess,
  deleteFromBilling,
  updateTableSubscriptionOnFailure,
  queryPromotionTable,
  refundLogs,
} = require("./renew.services");

function isJson(body) {
  try {
    JSON.parse(body);
    return true;
  } catch (err) {
    return false; /** IMPORTANT */
  }
}

module.exports = {
  renewController: (req, res) => {
    console.log("REQ BODY ", req.body);
    // console.log(req.body, "=== REQUEST BODY ===");
    if (req.body.Refund) {
      refundLogs(req.body.Refund, (err, ok) => {
        if (err)
          return res.json({
            error: 1,
            msg: "INTERNAL SERVER ERROR",
          });
        return res.json({
          error: 0,
          msg: ok,
        });
      });
    }
    let callback = {};

    if (isJson(req.body)) {
      callback = JSON.parse(req.body);
    } else {
      callback = req.body;
    }

    const data = callback["requestParam"]["data"];

    let renewalObj = {}; // Changed variable name to renewalObj
    for (let prop of data) {
      renewalObj[prop.name] = prop.value; // Corrected variable name here
    }

    if (renewalObj.Refund) {
      refundLogs(renewalObj, (err, ok) => {
        if (err)
          return res.json({
            error: 1,
            msg: "INTERNAL SERVER ERROR",
          });
        return res.json({
          error: 0,
          msg: ok,
        });
      });
      return;
    }
    const { Reason, Msisdn, ClientTransactionId, Refund } = renewalObj;
    // console.log("REASON_IS ==> ", Reason, "==<>==", Msisdn);
    if (Reason === undefined) {
      // console.log(util.inspect(yourObject, { depth: null }));
      // console.log("REASON_NITIN==>", util.inspect(req.body, { depth: null }));
    }

    if (Reason == "Successful" || Reason == "PaymentSuccess") {
      console.log("REASON_IS ==> ", Reason, "==<>==", Msisdn);
      insertIntoBillingLogs(renewalObj, (err, savedLogs) => {
        if (err)
          return res.json({
            error: 1,
            state: err,
            msg: "INTERNAL SERVER ERROR",
          });

        updateSubscriptionOnSuccess(
          { Msisdn, ClientTransactionId },
          async (err, success) => {
            if (err)
              return res.json({
                error: 1,
                state: err,
                msg: "INTERNAL SERVER ERROR",
              });

            await sleep(10000);

            insertIntoBillingSuccess(renewalObj, (err, billingSuccess) => {
              if (err) {
                return res.json({
                  error: 1,
                  state: err,
                  msg: "INTERNAL SERVER ERROR",
                });
              }
              deleteFromBilling(Msisdn, (err, deleted) => {
                if (err) {
                  return res.json({
                    error: 1,
                    state: err,
                    msg: "INTERNAL SERVER ERROR",
                  });
                }
                queryPromotionTable({ msisdn: Msisdn }, (err, hit) => {
                  if (err)
                    return res.json({
                      error: 0,
                      // state: err,
                      msg: "SAVED INTO BILLING SUCCESS",
                    });
                  if (hit) {
                    /*** SENDING PROMOTIONS */
                    console.log(
                      "[SUCCESS] === GREEN LIGHT FOR PROMOTION HIT ===",
                      [Msisdn]
                    );
                    promotionHandler({
                      msisdn: Msisdn,
                      ext_ref: ClientTransactionId,
                    });
                  }
                  console.log("[WARNING] === RED LIGHT FOR PROMOTION HIT ===", [
                    Msisdn,
                  ]);
                  return res.json({
                    error: 0,
                    state: "DONE",
                    msg: "SAVED INTO BILLING SUCCESS",
                  });
                });
              });
              /** PICKING SUBSCRIPTIONS OF PARKING */
            });
          }
        );
      });
    } else {
      // NO PAYMENT
      /** PATTERN -->
       * 0 -> 10 = SUB
       * 10 -> 15 = SUB RETRY
       * 0 -> 12 = REN
       * 12 -> 16 = REN RETRY */
      // SAVING BILLING LOGS

      insertIntoBillingLogs(renewalObj, (err, logs) => {
        if (err)
          return res.json({
            error: 1,
            state: err,
            msg: "INTERNAL SERVER ERROR",
          });
        updateBillingOnFail({ msisdn: Msisdn }, (err, active) => {
          if (err)
            return res.json({
              error: 1,
              state: err,
              msg: "INTERNAL SERVER ERROR",
            });
          /** UPDATING STATUS = REN ACTIVE = FALSE TO RESTRICT CONTENT ACCESS */
          // console.log(Reason)
          updateTableSubscriptionOnFailure(
            { msisdn: Msisdn, active, reason: Reason },
            (err, sub) => {
              if (err)
                return res.json({
                  error: 1,
                  state: err,
                  msg: "INTERNAL SERVER ERROR",
                });
              return res.json({
                error: 0,
                state: "ALL DONE",
                msg: "SUCCESS",
              });
              // insertIntoBillingFailed(renewalObj, (err, billingFailed) => {
              //   if (err)
              //     return res.json({
              //       error: 1,
              //       state: err,
              //       msg: "INTERNAL SERVER ERROR",
              //     });
              //   return res.json({
              //     error: 0,
              //     state: "ALL DONE",
              //     msg: "SUCCESS",
              //   });
              // });
            }
          );
        });
      });
    }
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
