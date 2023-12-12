const Router = require("express-promise-router");
const users = require("./users");
const auction = require("./auction");
const payments = require("./payments");

const router = Router();
router.use("/users", users);
router.use("/auction", auction);
router.use("/payments", payments);

module.exports = router;
