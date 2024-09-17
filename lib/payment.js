const { default: axios } = require("axios");
const { getToken } = require("./authToken");
const { promise_pool } = require("../database");

module.exports = {
    sendMoneyToWinner: async (
        msisdn, amount, network, service
    ) => {
 
        const [tokenError, authToken] = await getToken();
        if (tokenError) {
            throw ('Got token error')
        };
        const requestJson = {
            ogn: msisdn,
            opid: '011',
            amt: amount,
            mk: false,
            sid: `Ivvvv-1-${new Date().toLocaleDateString('en-CA')}`,
            config: "api",
            ak: process.env.PAYMENT_API_KEY,
            apid: process.env.PAYMENT_APP_ID
        };
        console.log(requestJson)
        const base64Request = _convertJsonToBase64(requestJson);
        let api_url = process.env.WINNER_PAYMENT_API + base64Request;
        console.log("Payment api to hit <->->->||<-<-<->", api_url);
        let sms_reponse, sms_error;
        try {
            const resp = await axios.get(
                api_url,
                {
                    headers: {
                        vaspid: process.env.VASP_ID.toString(),
                        'PISI-AUTHORIZATION-TOKEN': `Bearer ${authToken}`
                    }
                }
            );
            const data = await resp.data;
            console.log(data)
            sms_reponse = data;
        } catch (e) {
            sms_error = JSON.stringify(e?.response?.data)
        }
        const [e1, ok] = await _insertIntoAirtimeRequest({
            msisdn,
            amount: requestJson.amt,
            opid: requestJson.opid,
            ak: requestJson.ak,
            mk: requestJson.mk,
            sid: requestJson.sid,
            config: requestJson.config,
            apid: requestJson.apid,
            network,
            service,
            response_status: sms_error ? 500 : sms_reponse?.status || 200,
            response: sms_reponse ?? sms_error
        });
        console.log(e1, ok);
        if (e1) return ["error inserting data =>"];
        if (sms_error) return ["airtime req failed"]
        if (sms_reponse.status == 34) {
            return [sms_reponse?.message ?? "Payment Rejected"]
        }
        if (sms_reponse.status == -1) {
            return [sms_reponse?.message ?? "Payment Rejected", null];
        }
        if (sms_reponse.status == 200) {
            return [null, "successfully sent airtime req =>"]
        }
        return ["Payment Rejected"];
    }
}

function _convertJsonToBase64(json) {
    let buffer = new Buffer.from(JSON.stringify(json));
    return buffer.toString("base64");
}

async function _insertIntoAirtimeRequest(payload) {
    try {
        const [ok] = await promise_pool.query(
            process.env.INSERT_AIRTIME,
            [
                payload.msisdn,
                payload.amount,
                payload.opid,
                payload.ak,
                payload.mk,
                payload.sid,
                payload.config,
                payload.apid,
                payload.network,
                payload.service,
                payload.response_status,
                JSON.stringify(payload.response)
            ]
        );
        return [null, "Saved airtime logs ->"]
    } catch (e) {
        return [e]
    }
}

