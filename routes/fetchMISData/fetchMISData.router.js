const { fetchDataMIS, deactivateUser } = require("./fetchMISData.constroller");

const router = require("express").Router();

router.get("/mis", fetchDataMIS);
router.get("/deactivate", deactivateUser);

module.exports = router;
