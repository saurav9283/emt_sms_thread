
require('dotenv').config();

const axios = require('axios');

module.exports = {
    getAuthToken: async (req, res) => {
        try {
            const response = await axios.post(process.env.AUT_TOKEN_API, {
                vaspid: process.env.VASP_ID
            });

            if (response.data) {
                console.log("Received token:", response.data);
                res.json({
                    token: response.data
                });

            } else {
                console.error("No data received from token API");
                res.status(500).json({ error: 'No data ' });
            }

        } catch (error) {
            console.error("Error fetching token:", error);


            if (error.response) {
                console.error("API  status:", error.response.status);
                console.error("API error data:", error.response.data);
            }

            res.status(500).json({ error: 'Failed to fetch token' });
        }
    }
}
