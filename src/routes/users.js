const Router = require("express-promise-router");
const {
  getUsersList,
  login,
  myAccount,
} = require("../controller/userController");

const router = Router();

router.get("/", getUsersList);
router.get("/my-account", myAccount);
router.post("/login", login);

module.exports = router;
