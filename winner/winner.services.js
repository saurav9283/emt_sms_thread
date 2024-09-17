const { pool, promise_pool } = require("../database")

module.exports = {
    checkWinnersExist: async (service) => {
        console.log("fetch winner count=>", process.env.fetchWinnerCount)
        try {
            const [row] = await promise_pool.query(
                process.env.fetchWinnerCount,
                [service]
            );
            console.log("winer list", row)
            return [null, row[0]?.winner_exist ?? null]
        } catch (e) {
            return [e]
        }
    },
    checkCashWinnerExist: async (service) => {
        console.log("fetch cash winner count=>", process.env.fetchCashWinnerCount)
        try {
            const [row] = await promise_pool.query(
                process.env.fetchCashWinnerCount,
                [service]
            );
            return [null, row[0]?.winner_exist ?? null]
        } catch (e) {
            return [e]
        }
    },
    fetchTopPlayersFootball: async () => {
        console.log("fetch top footbal players =>", process.env.fetchPendingWinnersToRewardFootball)
        try {
            const [row] = await promise_pool.query(
                process.env.fetchPendingWinnersToRewardFootball,
                []
            );
            // console.log(row)
            return [null, row]
        } catch (e) {
            return [e]
        }
    },
    fetchTopPlayersFootballToCash: async () => {
        console.log("fetch top footbal players =>", process.env.fetchPendingWinnersToCashFootball)
        try {
            const [row] = await promise_pool.query(
                // process.env.fetchPendingWinnersToRewardFootball,
                process.env.fetchPendingWinnersToCashFootball,
                []
            );
            // console.log(row)
            return [null, row]
        } catch (e) {
            return [e]
        }
    },
    fetchTopPlayersInstantToCash: async () => {
        console.log("fetch top instant players =>", process.env.fetchPendingWinnersToCashInstant)
        try {
            const [row] = await promise_pool.query(
                process.env.fetchPendingWinnersToCashInstant,
                []
            );
            return [null, row]
        } catch (e) {
            return [e]
        }
    },
    fetchTopPlayersInstant: async () => {
        try {
            const [row] = await promise_pool.query(
                process.env.fetchPendingWinnersToRewardInstant,
                []
            );
            return [null, row]
        } catch (e) {
            return [e]
        }
    },
    insertIntoTableWinner: async (msisdn, service, amount) => {
        console.log("inserting winner query", process.env.insertTodayWinners)
        try {
            const [ok] = await promise_pool.query(
                process.env.insertTodayWinners,
                [
                    msisdn,
                    service,
                    amount
                ]
            );
            return [null, "Added into winner list =>"];
        } catch (e) {
            return [e];
        }
    }
}