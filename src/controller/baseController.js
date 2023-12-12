const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");

exports.getSessionTime = () => {
  const time = new Date(new Date().valueOf() + parseInt(process.env.SESSION));
  return moment.tz(time, process.env.TIME_ZONE);
};

exports.signAccessToken = (req, res, userId) => {
  try {
    if (userId) {
      const expiration = this.getSessionTime();
      const accessToken = jwt.sign(
        { data: userId + expiration },
        process.env.SESSION_KEY,
        { expiresIn: parseInt(process.env.SESSION) / 1000 }
      );
      const refreshToken = jwt.sign(
        { data: userId + expiration },
        process.env.SESSION_KEY,
        { expiresIn: parseInt(process.env.SESSION) / 1000 }
      );
      return { accessToken, refreshToken, expiration, userId };
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
