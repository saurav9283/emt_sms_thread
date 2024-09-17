const { default: axios } = require("axios");

const postRequest = async (API_URL, BODY) => {

    console.log(
        "POST_REQUEST",
        {
            API_URL,
            data: BODY
        }
    );

    try {
        const resp = await axios.post(
            API_URL,
            BODY
        );
        const data = await resp.data;
        return [null, data];
    } catch(e) {
        return [e]
    }
}

module.exports = {
    postRequest
}