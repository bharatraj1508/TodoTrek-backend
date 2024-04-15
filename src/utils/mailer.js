const helperFunction = require("../utils/helperFunctions");
const mongoose = require("mongoose");
const HashTable = mongoose.model("HashTable");
const token = require("../security/token");

const sgMail = require("@sendgrid/mail");
var mailResponse;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmailVerification = async (id, email) => {
  const hashValue = helperFunction.randomString(128);

  const emailToken = token.emailVerificationToken(hashValue);

  const mail_option = {
    to: email,
    from: "no.reply2This@outlook.com",
    subject: "Email Verification",
    text: `Hi,
    Hi, we have received a request to reset your password. If this was not sent by you, please ignore this email.
    Otherwise, please click on the link below to reset your password.
    This link will expire in 15 minutes.
    ${process.env.FRONTEND_URL}/verify/email/action?t=${emailToken}`,
    html: `<p> Hi, <p> </br></br>
    <p>Hi, we have received a request to reset your password. If this was not sent by you, please ignore this email.
    Otherwise, please click on the link below to reset your password.<p></br>
    <p>This link will expite in 15 minutes.</p></br></br>
    ${process.env.FRONTEND_URL}/verify/email/action?t=${emailToken}`,
  };

  try {
    const hash = new HashTable({ hash: hashValue, userId: id });
    await hash.save();

    await sgMail
      .send(mail_option)
      .then((response) => (mailResponse = response))
      .catch((err) => console.log(err));

    return mailResponse;
  } catch (err) {
    throw new Error(err.message);
  }
};

const sendPasswordResetEmail = async (id, email) => {
  const hashValue = helperFunction.randomString(128);
  const emailToken = token.emailVerificationToken(hashValue);

  const mail_option = {
    to: email,
    from: "no.reply2This@outlook.com",
    subject: "Reset Password",
    text: `Hi,
    Hi, we have received a request to reset your password. If this was not sent by you, please ignore this email.
    Otherwise, please click on the link below to reset your password.
    This link will expire in 15 minutes.
    ${process.env.FRONTEND_URL}/reset/password?t=${emailToken}`,
    html: `<p> Hi, <p> </br></br>
    <p>Hi, we have received a request to reset your password. If this was not sent by you, please ignore this email.<p></br>
    <p>Otherwise, please click on the link below to reset your password.<p></br>
    <p>This link will expite in 15 minutes.</p></br></br>
    ${process.env.FRONTEND_URL}/reset/password?t=${emailToken}`,
  };

  try {
    const hash = new HashTable({ hash: hashValue, userId: id });
    await hash.save();

    await sgMail
      .send(mail_option)
      .then((response) => (mailResponse = response))
      .catch((err) => console.log(err));

    return mailResponse;
  } catch (err) {
    throw new Error(err.message);
  }
};

const sendChangePasswordConfirmationEmail = async (email) => {
  const mail_option = {
    to: email,
    from: "no.reply2This@outlook.com",
    subject: "Password Changed Successfully",
    text: `Hi,
    Your password has been successfully updated. Please log in to your account using your new password. 
    If you did not make this change, please contact the administrator immediately for assistance.`,
    html: `<p> Hi, <p> </br></br>
    <p>Your password has been successfully updated. Please log in to your account using your new password.<p></br>
    <p>If you did not make this change, please contact the administrator immediately for assistance.<p></br>`,
  };

  try {
    await sgMail
      .send(mail_option)
      .then((response) => (mailResponse = response))
      .catch((err) => console.log(err));

    return mailResponse;
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  sendEmailVerification,
  sendPasswordResetEmail,
  sendChangePasswordConfirmationEmail,
};
