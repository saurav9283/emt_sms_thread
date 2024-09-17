const pool = require("../../database");
const { checkBillingSuccess } = require("../../service/renew.subscription");

module.exports = {
  updateSubscriptionOnSuccess: (payload, cb) => {
    const { Msisdn, ClientTransactionId } = payload;
    var { nextBillingDate, nextbilledDateTime } = getNextBillingDate(1);
    console.log({ nextBillingDate, nextbilledDateTime }, "=== NEXT DATE ===");
    const successQuery = process.env.UPDATE_TABLE_SUB_ON_SUCCESS.replace(
      "<MSISDN>",
      Msisdn
    )
      .replace("<NEXT_BILLING_DATE_TIME>", nextbilledDateTime)
      .replace("<ACTIVE>", "TRUE")
      .replace("<NEXT_BILLING_DATE>", nextBillingDate);
    console.log("SUCCESS_NITIN ", successQuery);

    pool.query(successQuery, [], (err, success) => {
      // console.log(err"=== IN SUB TABLE ===")
      if (err) return cb(err.sqlMessage, null);
      // console.log("[SUCCESS] ==== IN UPDATE TABLE SUBSCRIPTION ====", {
      //   err,
      // });

      return cb(null, "ok");
    });
  },
  deleteFromBilling: (msisdn, cb) => {
    let deleteBilling = process.env.DELETE_FORM_BILLING_ON_SUCCESS.replace(
      "<MSISDN>",
      msisdn
    );
    console.log("deleteBilling ", deleteBilling);
    pool.query(deleteBilling, [], (err, deleted) => {
      if (err) return cb(err, null);
      // console.log(`[SUCCESS] ==== IN_UPDATE_DELETE_BILLING ====${msisdn}`, {
      //   err,
      // });
      return cb(null, "OK");
    });
  },
  insertIntoBillingLogs: (payload, cb) => {
    const {
      Reason,
      ClientTransactionId,
      Msisdn,
      ChargeAmount,
      TransactionId,
      BillingId,
      Channel,
      Type,
      OfferCode,
    } = payload;
    pool.query(
      process.env.INSERT_INTO_BILLING_LOGS.replace("<MSISDN>", Msisdn)
        .replace("<CHARGE_AMOUNT>", ChargeAmount)
        .replace("<TYPE>", Type)
        .replace("<CLIENT_ID>", ClientTransactionId)
        .replace("<REASON>", Reason)
        .replace("<CHANNEL>", Channel)
        .replace("<OFFER_CODE>", OfferCode)
        .replace("<TRANSACTION_ID>", TransactionId)
        .replace("<BILLING_ID>", BillingId),
      [],
      (err, savedLogs) => {
        if (err) return cb(err, null);
        // console.log("[SUCCESS] ==== IN BILLING LOGS ====", { err });
        return cb(null, "OK");
      }
    );
  },
  insertIntoBillingSuccess: async (payload, cb) => {
    // SUCCESS_NITIN
    const {
      Reason,
      ClientTransactionId,
      Msisdn,
      ChargeAmount,
      TransactionId,
      BillingId,
      Channel,
      Type,
      OfferCode,
    } = payload;
    var { nextBillingDate, nextbilledDateTime } = getNextBillingDate(1);
    let billingStatusCheck = process.env.CHECK_RECORD_STATUS.replace(
      "<MSISDN>",
      Msisdn
    );
    await sleep(10000);
    console.log("billingStatusCheck ", billingStatusCheck);
    // pool.query(`${billingStatusCheck}`, [], async (err, resultItem) => {
    // pool.query(`${billingStatusCheck}`, [], async (err, resultItem) => {
    checkBillingSuccess(Msisdn, (errItem, resultItem) => {
      if (errItem) throw errItem;
      console.log("CNT_IS_CALLBACK ", resultItem, Msisdn);
      if (resultItem[0].CNT <= 0)
        pool.query(billingStatusCheck, async (err, resultItem) => {
          if (err) {
            console.error("NITIN_EVENT", err);
            return cb(err.sqlMessage, null);
          }
          await sleep(2000);
          // console.log(type_ev[0].type_event);
          console.log(
            "NITIN_EVENT_ ",
            resultItem[0].type_event,
            "<===>",
            billingStatusCheck
          );
          // let typeEvent = "";
          // if (resultItem[0].type_event === undefined) typeEvent = "SUB";
          // else resultItem[0].type_event;

          let INSERT_INTO_BILLING_SUCCESS =
            process.env.INSERT_INTO_BILLING_SUCCESS.replace("<MSISDN>", Msisdn)
              .replace("<CHARGE_AMOUNT>", ChargeAmount)
              .replace("<TYPE>", Type)
              .replace("<CLIENT_ID>", ClientTransactionId)
              .replace("<REASON>", Reason)
              .replace("<CHANNEL>", Channel)
              .replace("<OFFER_CODE>", OfferCode)
              .replace("<TRANSACTION_ID>", TransactionId)
              .replace("<BILLING_ID>", BillingId)
              .replace("<NEXT_BILLED_DATE>", nextBillingDate)
              .replace("<TYPE_EVENT>", resultItem[0].type_event)
              .replace("<NEXT_BILLED_DATE_TIME>", nextbilledDateTime);
          console.log(
            "SUCCESS_NITIN ==->",
            INSERT_INTO_BILLING_SUCCESS,
            resultItem[0].type_event
          );

          pool.query(`${INSERT_INTO_BILLING_SUCCESS}`, [], (err, savedLogs) => {
            if (err) return cb(err, null);
            // console.log("[SUCCESS] ==== IN BILLING SUCCESS ====", { err });
            return cb(null, "OK");
          });
        });
      else return cb(null, "OK");
    });
  },

  updateBillingOnFail: ({ msisdn }, cb) => {
    pool.query(
      process.env.CHECK_RECORD_STATUS.replace("<MSISDN>", msisdn),
      [],
      (err, status) => {
        if (err) return cb(err, null);
        // console.log("[SUCCESS] ==== IN CHECK RECORD STATUS ====", {
        //   err,
        //   exist: status.length,
        // });
        if (status.length > 0) {
          //   const { record_status } = status[0];
          const { type_event } = status[0];

          //   console.log("Nitin", type_event);

          let old_status = "";
          var active = "False"; /** BEACUSE THIS FUNCTION IS FOR FAILURES */
          if (type_event === "REN") {
            /** SUB FAILED :: 10 --> 15 <<-- 10 */
            old_status = "10";
          }
          if (type_event === "SUB") {
            /** REN FAILED :: 10 --> 15 <<-- 12 */
            /** RESTRICT CONTENT FOR RENEWALS */
            old_status = "12";
          }
          // if (record_status == "10") {
          //     /** MULTIPLE CALLBACK */
          //     console.log("[ERROR] === MULTIPLE CALLBACK ===")
          //     old_status = "10";
          // } if (record_status == "12") {
          //     /** MULTIPLE CALLBACK */
          //     console.log("[ERROR] === MULTIPLE CALLBACK ===")
          //     old_status = "12";
          // }
          // console.log(
          //   "[INFO] ==== OLD STATUS NITIN ===",
          //   [old_status],
          //   status[0]
          // );
          pool.query(
            process.env.UPDATE_BILLING_TYPE.replace(
              "<RECORD_STATUS>",
              old_status
            ).replace("<MSISDN>", msisdn),
            [],
            (err, billingUpdated) => {
              if (err) return cb(err, null);
              // console.log("[SUCCESS] ==== IN UPDATE BILLING TYPE ====", {
              //   err,
              // });
              return cb(null, active);
            }
          );
        }
      }
    );
  },

  updateTableSubscriptionOnFailure: ({ msisdn, active, reason }, cb) => {
    // console.log(active, ["==== INFO IF FALSE IT MUST A RENEWAL ===="]);
    if (
      reason === "MSISDN Is In Invalid State" ||
      reason === "Number Not in Billing System"
    ) {
      const DELETE_FORM_BILLING_ON_SUCCESS =
        process.env.DELETE_FORM_BILLING_ON_SUCCESS.replace("<MSISDN>", msisdn);
      // console.log(
      //   "DELETE_FORM_BILLING_ON_SUCCESS ",
      //   DELETE_FORM_BILLING_ON_SUCCESS
      // );
      pool.query(
        `${DELETE_FORM_BILLING_ON_SUCCESS}`,
        [],
        (errdelete, resultDelete) => {
          if (errdelete) {
            throw errdelete;
          }
          const insertSubChurn = process.env.insertSubChurn.replace(
            "<MSISDN>",
            msisdn
          );
          // console.log("insertSubChurn ", insertSubChurn);
          pool.query(`${insertSubChurn}`, [], (errChurn, resultChurn) => {
            if (errChurn) {
              console.log(errChurn);
            }
            const deleteSubscription = process.env.deleteSubscription.replace(
              "<MSISDN>",
              msisdn
            );
            // console.log("deleteSubscription ", deleteSubscription);
            pool.query(
              `${deleteSubscription}`,
              [],
              async (errDelete, resultDelete) => {
                if (errDelete) {
                  console.log(errDelete);
                }
                await sleep(2000);
                return cb(null, "OK");
              }
            );
          });
        }
      );
    } else {
      pool.query(
        process.env.UPDATE_TABLE_SUB_ON_FAILED_CHARGE.replace(
          "<ACTIVE>",
          active
        ).replace("<MSISDN>", msisdn),
        (err, subUpdated) => {
          if (err) return cb(err, null);
          // console.log("[SUCCESS] ==== IN UPDATE SUB ON FAILED ====", { err });
          return cb(null, "OK");
        }
      );
    }
  },
  insertIntoBillingFailed: (payload, cb) => {
    const {
      Reason,
      ClientTransactionId,
      Msisdn,
      ChargeAmount,
      TransactionId,
      BillingId,
      Channel,
      Type,
      OfferCode,
    } = payload;

    pool.query(
      process.env.INSERT_INTO_BILLING_FAILED.replace("<MSISDN>", Msisdn)
        .replace("<CHARGE_AMOUNT>", ChargeAmount)
        .replace("<TYPE>", Type)
        .replace("<CLIENT_ID>", ClientTransactionId)
        .replace("<REASON>", Reason)
        .replace("<CHANNEL>", Channel)
        .replace("<OFFER_CODE>", OfferCode)
        .replace("<TRANSACTION_ID>", TransactionId)
        .replace("<BILLING_ID>", BillingId),
      [],
      (err, billingFail) => {
        if (err) return cb(err, null);
        // console.log("[SUCCESS] ==== IN BILLING FAILED ====", { err });
        return cb(null, billingFail);
      }
    );
  },

  queryPromotionTable: ({ msisdn }, cb) => {
    pool.query(
      process.env.CHECK_SENDED_PROMOTION.replace("<MSISDN>", msisdn),
      [],
      (err, exist) => {
        if (err) return cb(err, null);

        if (exist.length > 0) {
          console.log("[INFO] ==== EXIST IN PROMOTION TABLE ====", [exist]);
          return cb(err);
        } else {
          console.log("[INFO] ==== NOT EXIST IN PROMOTION TABLE ====", { err });
          return cb(null, "HIT");
        }
      }
    );
  },

  refundLogs: (payload, cb) => {
    const {
      Msisdn,
      Refund,
      ClientTransactionId,
      Description,
      OfferCode,
      Type,
    } = payload;
    pool.query(
      process.env.INSERT_REFUND_LOGS.replace("<Msisdn>", Msisdn)
        .replace("<Refund>", Refund)
        .replace("<ClientTransactionId>", ClientTransactionId)
        .replace("<Description>", Description)
        .replace("<OfferCode>", OfferCode)
        .replace("<Type>", Type),
      [],
      (err, result) => {
        console.log(err);
        if (err) return cb(err, null);
        console.log("[SUCCESS] === SAVED REFUND LOGS ===");
        return cb(null, "OK");
      }
    );
  },
};

function getNextBillingDate(day) {
  const currentDate = new Date();
  const futureDate = new Date(currentDate);
  futureDate.setDate(currentDate.getDate() + day);
  let nextBillingDate = futureDate.toISOString();

  return {
    nextBillingDate: nextBillingDate.split("T")[0],
    nextbilledDateTime: nextBillingDate.split(".")[0],
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
