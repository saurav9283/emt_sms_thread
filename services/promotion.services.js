const { default: axios } = require("axios");
const pool = require("../database");

async function promotionHandler({ msisdn, ext_ref }) {
    const url = process.env.FORWARD_PROMOTION
        .replace("<ANI>", msisdn)
        .replace("<EXT_REF>", ext_ref);

    let response, status;
    console.log(url, ext_ref)
    try {

        const resp = await axios.get(url);
        const data = await resp.data;

        console.log(data, "=== PROMOTION LOGS ===", [msisdn]);

        response = JSON.stringify(data);
        status = "OK";

    } catch (ex) {
        console.log(ex.response.data, "=== PROMOTION ERROR ===", [msisdn]);

        response = JSON.stringify(ex.response.data);
        status = "FAILED";
    }
    
    savPromotionLogs({
        msisdn,
        ext_ref,
        response,
        url,
        status,
    });
    return "OK";
}

async function savPromotionLogs(payload) {
    const { msisdn, ext_ref, response, url, status } = await payload

    pool.query(
        process.env.INSERT_PTOMOTION
            .replace("<MSISDN>", msisdn)
            .replace("<RESPONSE>", response)
            .replace("<STATUS>", status)
            .replace("<URL>", url)
            .replace("<EXT_REF>", ext_ref),
        [], (err, done) => {
            if (err) return console.log(err.sqlMessage, "=== FAILED TO SAVE PROMOTION LOGS ===");
            console.log("=== SAVED PROMOTION LOGS ===");
            return "OK"
        }
    )
}


module.exports = {promotionHandler}