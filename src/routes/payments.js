const Router = require("express-promise-router");
const { updateBalance } = require("../controller/paymentController");
const { verifyAdminToken } = require("../middleware/auth");

const router = Router();

router.post("/update-balance", verifyAdminToken, updateBalance);

module.exports = router;
