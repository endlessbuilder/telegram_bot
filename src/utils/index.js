const crypto = require("crypto");
const moment = require("moment-timezone");

exports.rtFixed = (num, count = 6) => {
  const re = new RegExp("^-?\\d+(?:.\\d{0," + (count || -1) + "})?");
  let changeNum = num;

  const ree = changeNum.toString().match(re)[0];
  const reee = Number(ree).toFixed(count);
  return Number(reee);
};

exports.encrypt = (text) => {
  let iv = crypto.randomBytes(Number(process.env.IV_LENGTH));
  let cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + "::" + encrypted.toString("hex");
};

exports.decrypt = (text) => {
  try {
    let textParts = text.split("::");
    let iv = Buffer.from(textParts.shift(), "hex");
    let encryptedText = Buffer.from(textParts.join("::"), "hex");
    let decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(process.env.ENCRYPTION_KEY),
      iv
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return "";
  }
};

exports.getSydneyTime = () => {
  let time = moment.tz(new Date(), process.env.TIME_ZONE);
  time.utc("+1000").format().valueOf();
  return time;
};
