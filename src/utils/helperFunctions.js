const crypto = require("crypto");

const randomString = (length) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex");
};

module.exports = {
  randomString,
};
