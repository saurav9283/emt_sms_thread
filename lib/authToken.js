const { postRequest } = require("./lib");
const { promise_pool } = require("../database");

const getToken = async () => {
    const [e1, assessToken] = await getStoredToken();

    if(e1) {
        const [e2, newToken] = await generateNewToken();
        // FAILED to generate toekn and getting token from DB
        console.log({e2, newToken})
        if(e2)
            return [e2, null];
    }

    if(!assessToken) {
        console.log("TOKEN IS NOT VALID GETTING NEW TOKEN")
        // TOKEN DOES NOT EXIST GENERATE NEW TOKEN 
        const [newTokenError, newToken] = await generateNewToken();
        // FAILED to generate toekn and getting token from DB
        console.log({ newTokenError })
        if(newTokenError)
            return [newTokenError, null];
        // got new token save in db
        console.log("GOT NEW TOKEN")
        
        const [checkError, exist] = await chechExisting();
        console.log({ checkError });

        if(checkError)  
            return ["Internal server error"];

        if(exist.length > 0) {
            // update
            console.log("TOKEN EXIST SO UPDATING ->")
            updateAuthToken(newToken);
        } else {
            // insert
            console.log("INSERT TOKEN ->")
            saveTokenLogs(newToken);
        }
        
        return [null, newToken['pisi-authorization-token']]
        // sended new token and saved to data base
    }
    if(assessToken.auth_token) {
        // Token exist so send this token
        // console.log("TOKEN IS VALID")
        return [null, assessToken.auth_token]
    }
    
};



const generateNewToken = async () => {
    const [tokenError, data] = await postRequest(
        process.env.AUT_TOKEN_API,
        {
            vaspid: process.env.VASP_ID
        }
    );

    if(tokenError) return [tokenError];
    console.log(data, "NEW TOKEN")
    const { statusCode } = data;

    if(statusCode == "1000") 
        return [null, data];
    else
        return ["New token generating error", null];

}

const getStoredToken = async () => {
    try {
        const [token] = await promise_pool.query(
            process.env.GET_AUTH_TOKEN
        );
        return [null, token[0]]
    } catch (e) {
        console.log(e, "GET TOKEN FROM DB")
        return [e.sqlMessage]
    }
}

const chechExisting = async () => {
    try{
        const [exist] = await promise_pool.query(
            process.env.CHECK_EXISTING_TOKEN
        );
        console.log(exist)
        return [null, exist]
    } catch (e) {
        console.log(e)
        return [e.sqlMessage]
    }
}
const saveTokenLogs = async (payload) => {

    console.log(payload['pisi-authorization-token'])
    try {
        const [ok] = await promise_pool.query(
            process.env.INSERT_INTO_AUTH_TOKEN,
            [
                payload.provider,
                payload['pisi-authorization-token'],
                payload.expiration,
            ]
        );
      return [null, "Token saved successfully"]
    } catch (e) {
        console.log(e)
        return [e.sqlMessage]
    }
};

const updateAuthToken = async (payload) => {
    try {
        const [ok] = await promise_pool.query(
            process.env.UPDATE_INTO_AUTH_TOKEN,
            [
                payload['pisi-authorization-token'],
                payload.provider
            ]
        );
        return [null, "Token updated successfully"]
    } catch (e) {
        console.log(e)
        return [e.sqlMessage]
    }
}


module.exports = {
    getToken
}