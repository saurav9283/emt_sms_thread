const { default: axios } = require("axios");
const { insertSmsLogs } = require("../services/sms.services");
const { getToken } = require("./authToken");

const sendSms = async (PAYLOAD) => {
    //console.log("INSIDE->SMS->LOGS")
    const [tokenError, authToken] = await getToken();

    if (tokenError) {
      console.log(
        "--------------------------------- GOT TOKEN ERROR -----------------------------------"
      );
      return false;
    }
    const CONFIG = {
        headers: {
            vaspid: process.env.VASP_ID.toString(),
            'PISI-AUTHORIZATION-TOKEN': `Bearer ${authToken}`
        }
    };

    let success_response, error_response;

    try {
        const resp = await axios.post(
            process.env.SEND_SMS_API,
            PAYLOAD,
            CONFIG
        );
        success_response = await resp.data;
    } catch(error) {
        error_response = error.response;
    }
    
    if(error_response) return [error_response?.data];

    insertSmsLogs({
        msisdn: PAYLOAD.msisdn,
        message: PAYLOAD.message,
        pisisid: PAYLOAD.pisisid,
        trxid: PAYLOAD.trxid,
        sms_request: JSON.stringify({CONFIG, PAYLOAD}),
        sms_response: JSON.stringify(error_response || success_response)
    });
    
    return [null, success_response]
}

module.exports = { sendSms };

