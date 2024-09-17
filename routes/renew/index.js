const renewRouter = require("express").Router();
const { renewController } = require("./renew.controller");

renewRouter.post("/", renewController)

module.exports = renewRouter