const jwt = require("jsonwebtoken");

const newAccessToken = (id) => {
  const token = jwt.sign({ userId: id }, process.env.MY_SECRET_KEY, {
    expiresIn: "1d",
  });

  return token;
};

const emailVerificationToken = (hash) => {
  const token = jwt.sign({ hash: hash }, process.env.MY_SECRET_KEY, {
    expiresIn: "15m",
  });

  return token;
};

const verifyTokenAndReturnHash = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.MY_SECRET_KEY, (err, payload) => {
      if (err) {
        reject(err); // Reject the promise with the error
      } else {
        const { hash } = payload;
        resolve(hash); // Resolve the promise with the hash value
      }
    });
  });
};

module.exports = {
  newAccessToken,
  emailVerificationToken,
  verifyTokenAndReturnHash,
};
