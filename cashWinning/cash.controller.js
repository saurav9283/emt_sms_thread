
const express = require("express");
const { sendSms } = require("../lib/sendSms");
const { checkCashWinnerExist, fetchTopPlayersFootballToCash, fetchTopPlayersInstantToCash } = require("../winner/winner.services");
const { saveAccountDetails, insertIntoTableCash } = require("./cash.services");

module.exports = {
    sendCashToWinner: async (service, amount, network) => {
        const message1 = `Yello, you won! You are a lucky winner of  ${service} Daily  N5,000 Naira cash prize. Kindly send your account number and name to +2348142261082. Thanks, and keep playing`;
        console.log(message1, "-=-=")

        const message2 = `Congratulations, you won! You are a lucky winner of  Instant Game Daily N5,000 Naira cash prize. Kindly send your account number and name to +2348142261082. Thanks, and keep playing.`;
        try {
            // First check if 10 winners exist for a service
            const [e1, winners] = await checkCashWinnerExist(service);
            if (e1) {
                return console.log("error:[11]", e1);
            }
            if (winners >= 10) {
                console.log("10 Winners already exist for this service.");
                return;
            }
            let ex, topPlayers;
            // If winners don't exist, fetch top 10 players /from the database
            if (service == "Football Quiz") {
                [ex, topPlayers] = await fetchTopPlayersFootballToCash();
            }
            if (service == "Instant Game") {
                [ex, topPlayers] = await fetchTopPlayersInstantToCash()
            }

            if (ex) {
                return console.log("[28]: Failed to fetch winner list...")
            };

            if (!topPlayers || topPlayers.length === 0) {
                console.log("No winner player found for this service=>", service);
                return;
            }
            // send message to topplayer to share account details
            for (let i = 0; i < topPlayers.length; i++) {
                console.log("got players =>", topPlayers[i]);
                const { msisdn } = topPlayers[i];
                if (msisdn === undefined) return;

                if (network == "MTN") {
                    const smsPayload = {
                        msisdn: msisdn,
                        pisisid: "174",
                        message: message1,
                        trxid: getUuid(),
                    };

                    console.log(smsPayload)
                    try {
                        const [sms_error, sms_success] = await sendSms(smsPayload);
                        // Handle sms_error and sms_success here
                        if (sms_error) {
                            console.error('SMS Error:', sms_error);
                        } else {
                            console.log('SMS Success:', sms_success);
                            await insertIntoTableCash(msisdn, service, network, amount, message1);
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }

                if (service == "Instant Game" && network == "GLO") {
                    const smsPayload = {
                         msisdn: msisdn,
                        pisisid: "176",
                        message: message2,
                        trxid: getUuid(),
                    };
                    console.log(smsPayload)
                    try {
                        const [sms_error, sms_success] = await sendSms(smsPayload);
                        // Handle sms_error and sms_success here
                        if (sms_error) {
                            console.error('SMS Error:', sms_error);
                        } else {
                            console.log('SMS Success:', sms_success, service);
                            await insertIntoTableCash(msisdn, service, network, amount, message2);
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }
            }
        } catch (error) {
            console.log("error:[12]", error);
        }
    },

    AccountDetailController: async (req, res) => {
        const { msisdn, account_number, account_holder_name } = req.body;
        console.log({ msisdn, message });

        const [e1, result] = await saveAccountDetails(msisdn, account_number, account_holder_name);
        if (e1) {
            return res.status(500).json({ error: e1 });
        }
        return res.status(200).json({ result });
    }
}

function getUuid() {
    let str = "qwertyuiopasdfghjklzxcvbnm1234567890";
    let uuid = "IGW-";
    for (let i = 10; i > 0; i--) {
        uuid += str.charAt(Math.random() * str.length);
    }
    return uuid;
}
