const { sendMoneyToWinner } = require('../lib/payment');
const { checkWinnersExist,
    fetchTopPlayersFootball,
    fetchTopPlayersInstant,
    insertIntoTableWinner
} = require('./winner.services');
const { sendSms } = require('../lib/sendSms');

module.exports = {
    sendRewardToWinner: async (service, amount, network) => {
        console.log("starting_winner_thread", new Date().toISOString());
        try {
            // First check if 10 winners exist for a service
            const [e1, winners] = await checkWinnersExist(service);
            if (e1) {
                return console.log("error:[11]", e1);
            }
            if (winners >= 10) {
                console.log("10 Winners already exist for this service.");
                return;
            }
            let ex, topPlayers;
            // If winners don't exist, fetch top 10 players from the database
            if (service == "Football Quiz") {
                [ex, topPlayers] = await fetchTopPlayersFootball();
            }
            if (service == "Instant Game") {
                [ex, topPlayers] = await fetchTopPlayersInstant()
            }

            if (ex) {
                return console.log("[28]: Failed to fetch winner list...")
            };

            if (!topPlayers || topPlayers.length === 0) {
                console.log("No winner player found for this service=>", service);
                return;
            }
            // Reward the top players with a payment
            for (let i = 0; i < topPlayers.length; i++) {
                console.log("got players =>", topPlayers[i]);
                const { msisdn } = topPlayers[i];
                // console.log(msisdn)
                if (msisdn === undefined) return;
                const [pay_error, pay_success] = await sendMoneyToWinner(
                    msisdn,
                    amount,
                    network,
                    service
                );
                console.log({ pay_error, pay_success });

                if (pay_error) {
                    console.log(pay_error);
                    return;
                }
                const [e2, ok] = await insertIntoTableWinner(
                    msisdn,
                    service,
                    amount,
                );
                if (e2) return console.log(e2);
                console.log(ok);
                if (service == "Instant Game") {
                    const smsPayload = {
                        msisdn,
                        pisisid: "176",
                        message: `NGN 500 NGN 500 NGN 500, Congratulations you ve won yourself N500 airtime`,
                        trxid: getUuid(),
                    }
                    console.log("Instant Winner sms payload=>>>", smsPayload);
                    sendSms(smsPayload);
                };
            };
            return "Success";
        } catch (error) {
            return "Error occurred while sending rewards:" + error;
        }
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
