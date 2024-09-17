const { promise_pool } = require("../database")

const insertSmsLogs = async (payload) => {
    try{
        const [ok] = await promise_pool.query(
            process.env.INSERT_SMS_LOGS,

            [
                payload.msisdn,
                payload.message,
                payload.pisisid,
                payload.trxid,
                payload.sms_request,
                payload.sms_response
            ]
        );
        return [null, "Saved sms logs successfully"]
    } catch (e) {
        console.log(
            "AT_SMS_LOGS", e
        )
        return [e.sqlMessage]
    }
}
// creating user sms session ->
const saveUserLogs = async (payload) => {
    try {   
        const [ok] = await promise_pool.query(
            process.env.INSERT_USER_LOGS,
            [ 
                payload.msisdn,
            ]
        )
    } catch (e) {
        console.log(
            "AT_SAVE_USER_LOGS", e
        );
        return [e]
    }
} 
// cehck user answer ->
const checkCorrectAsnwer = async (msisdn, answer) => {
    try {
        const [result] = await promise_pool.query(
            process.env.CHECK_CORRECT_ANSWER_NEW,
            [msisdn, answer]
        );
        return [null, result[0]];
        
    } catch (e) {
        console.log(
            "ERROR_IN_CHECK_ANSWER",
            e
        );
        return [e]
    }
} 
const upadteUserPoints =  async (msisdn) => {
    try {
        const [Updated] = await promise_pool.query(
            process.env.UPDATE_USER_POINTS,
            [
                msisdn
            ]
        );
        console.log(Updated.info, "UPDATED USER POINTS")
        return [null, "Updated user points"]
    } catch (e) {
        console.log(
            "CANNOT UPDATE USER POINTS", e
        )
        return [e]
    }
}

const insertUserPoints = async (msisdn) => {
    try {   
        const [ok] =  await promise_pool.query(
            process.env.INSERT_INTO_USER_TABLE,
            [
               msisdn,
               process.env.DEFAULT_POINTS,
            ]
        );
        return [null, "Saved user points successfully"]
    } catch (e) {
        console.log(
            "ERROR_IN_USER_INSERT_POINTS", e
        )
        return [e]
    }
}

const checkExistingPoints = async (msisdn) => {
    try{
        const [exist] = await promise_pool.query(
            process.env.CHECK_USER_POINTS,
            [
                msisdn
            ]
        );
        return [null, exist[0]]
    }catch(e) {
        console.log(
            "EXISTING_POINTS", e
        )
        return [e]
    }
}

const deletedUserPoints = async (msisdn) => {
    try {
        const [ok] = await promise_pool.query(
            process.env.DELETE_FROM_USER_TABLE,
            [
                msisdn
            ]
        );
        return [null, "Deleted from user table"]
    } catch (e) {
	    console.log(e, "ERROR IN DELETE USER POINTS TABLE")
        return [e]
    }
    
}
module.exports  = {
    insertSmsLogs,
    upadteUserPoints,
    checkExistingPoints,
    insertUserPoints,
    checkCorrectAsnwer,
    deletedUserPoints
}