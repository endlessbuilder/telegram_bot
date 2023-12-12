const Router = require("express-promise-router");
const {
    create,
    createTokenAuction
} = require("../controller/botController");
const { verifyAdminToken } = require("../middleware/auth");

const router = Router();

router.post("/create_auction", verifyAdminToken, create);
router.post("/create_auction_token", verifyAdminToken, createTokenAuction);


module.exports = router;
