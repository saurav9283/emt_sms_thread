const { promise_pool } = require("../database")

module.exports = {
    saveAccountDetails: async (msisdn, account_number, account_holder_name) => {
        const insert_query = process.env.INSERT_ACC_DETAILS;
        console.log('insert_query: ', insert_query);
        try {
            promise_pool.query(insert_query, [msisdn, account_number, account_holder_name], (err, result) => {
                if (err) {
                    console.log("ERROR_IN_SAVING_ACCOUNT_DETAILS", err);
                    return [err];
                } else {
                    console.log("ACCOUNT_DETAILS_SAVED_SUCCESSFULLY");
                    return [null, "Account details saved successfully"];
                }
            });
        }
        catch (error) {
            console.log("ERROR_IN_SAVING_ACCOUNT_DETAILS", error);
            return [error];
        }
    },
    insertIntoTableCash: async (msisdn, service, network, amount, message) => {
        let amount1= parseInt(amount)
        let insert_query;
        if (network == "MTN") {
            insert_query = process.env.INSERT_INTO_CASH_TABLE.replace('<MSISDN>', msisdn).replace('<SERVICE>', service).replace('<NETWORK>', network).replace('<AMOUNT>', amount1).replace('<MESSAGE>', message);
        }
        if (network == "GLO") {
            insert_query = process.env.INSERT_INTO_CASH_TABLE_GLO;
        }
        console.log('insert_query: ', insert_query);
        try {
            promise_pool.query(insert_query, [msisdn, service, network, amount, message], (err, result) => {
                if (err) {
                    console.log("ERROR_IN_INSERTING_INTO_CASH_TABLE", err);
                    return [err];
                } else {
                    console.log("INSERTED_INTO_CASH_TABLE_SUCCESSFULLY");
                    return [null, "Inserted into cash table successfully"];
                }
            });
        }
        catch (error) {
            console.log("ERROR_IN_INSERTING_INTO_CASH_TABLE", error);
            return [error];
        }
    }
}