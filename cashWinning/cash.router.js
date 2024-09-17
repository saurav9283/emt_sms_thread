const express = require("express");
const { saveAccountDetails } = require("./cash.services");
const e = require("express");
const { AccountDetailController } = require("./cash.controller");

const router = express.Router();

router.post("/save-accountDetails", AccountDetailController)

module.exports = router;
