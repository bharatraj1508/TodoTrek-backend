const express = require("express");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const HashTable = mongoose.model("HashTable");
const router = express.Router();

const tokenFunction = require("../../security/token");
const mailer = require("../../utils/mailer");
const helper = require("../../utils/helperFunctions");
const requireToken = require("../../middlewares/requireToken");

/*
@type     -   POST
@route    -   /auth/sign_up
@desc     -   Endpoint to signup the new users.
@access   -   public
*/
router.post("/sign_up", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(409).json({
      message: "This email already exist. Please login using this email",
    });
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Bad Request! email or password should be provided" });
  try {
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      accountType: "LOCAL",
    });
    await newUser.save();

    const user = await User.findOne({ email });
    const mailResponse = await mailer.sendEmailVerification(user._id, email);
    const token = tokenFunction.newAccessToken(user._id);
    res.status(200).json({
      message: "Account has been created successfully",
      token,
      mailResponse,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
@type     -   POST
@route    -   /auth/sign_in
@desc     -   Endpoint to signin the existing users.
@access   -   public
*/
router.post("/sign_in", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Bad Request! email or password should be provided" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User does not exist" });

    if (!user.isVerified)
      return res.status(401).json({ message: "User email is not verified" });

    if (!(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid Password" });

    const token = tokenFunction.newAccessToken(user._id);

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
@type     -   POST
@route    -   /auth/email/verify
@desc     -   Endpoint to to verify the email address for the existing users.
@access   -   public
*/
router.post("/email/verify", async (req, res) => {
  const token = req.query.token;
  try {
    const tokenHash = await tokenFunction.verifyTokenAndReturnHash(token);

    const hash = await HashTable.findOne({ hash: tokenHash });
    if (hash) {
      await User.findByIdAndUpdate(hash.userId, { isVerified: true });
      await HashTable.findByIdAndDelete(hash._id);
      res.status(200).json({ message: "Email Verified Successfully" });
    } else {
      return res.status(400).json({
        message:
          "Something went wrong. Please try again or send a new verification request.",
      });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/*
@type     -   POST
@route    -   /auth/user/send-email-verification
@desc     -   Endpoint to send a new verification email to the user to verify email
@access   -   public
*/
router.post("/user/send-email-verification", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    const mailResponse = await mailer.sendEmailVerification(user._id, email);
    res
      .status(200)
      .json({ message: "Email has been sent successfully", mailResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
@type     -   POST
@route    -   /auth/user/password-reset-mail
@desc     -   Endpoint to semd the email for resetting the user's password.
@access   -   public
*/
router.post("/user/send-password-reset", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "This email does not exist" });

    const mailResponse = await mailer.sendPasswordResetEmail(user._id, email);
    res
      .status(200)
      .json({ message: "Email has been sent successfully", mailResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
@type     -   PUT
@route    -   /auth/user/reset-password
@desc     -   Endpoint to reset the user password if the user has forgot.
@access   -   private
*/
router.put("/user/reset-password", async (req, res) => {
  const { password } = req.body;
  const token = req.query.token;
  try {
    const tokenHash = await tokenFunction.verifyTokenAndReturnHash(token);

    const hash = await HashTable.findOne({ hash: tokenHash });
    if (hash) {
      await User.updateOne({ _id: hash.userId }, { password: password });
      await HashTable.findByIdAndDelete(hash._id);

      User.findById(hash.userId).then(async (user) => {
        await mailer.sendChangePasswordConfirmationEmail(user.email);
        res.status(200).json({ message: "Password reset successfully" });
      });
    } else {
      return res.status(400).json({
        message:
          "Something went wrong. Please send a new verification request.",
      });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /auth/register/google_account
@desc     -   Endpoint to register the google account.
@access   -   public
*/
router.post("/register/google_account", async (req, res) => {
  const { firstName, lastName, email, googleId } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      if (!user.googleId)
        return res.status(409).json({
          message:
            "Please login using the email and password. This account was not signed up using Google",
        });

      const token = tokenFunction.newAccessToken(user._id);
      return res.status(200).json({ token });
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: helper.randomString(16),
      isVerified: true,
      googleId,
      accountType: "GOOGLE",
    });

    newUser.save().then((user) => {
      const token = tokenFunction.newAccessToken(user._id);
      res.status(200).json({ token });
    });
  } catch (error) {
    console.error("Error:", error.response.data.error);
    res.status(500).json({ error });
  }
});

/*
@type     -   GET
@route    -   /auth/current_user
@desc     -   Endpoint to resturn the current user which is signed in
@access   -   private
*/
router.get("/current_user", requireToken, (req, res) => {
  const user = req.user;
  if (!user) return res.status(404).json({ message: "No user found" });
  res.status(200).json({ user });
});

module.exports = router;
