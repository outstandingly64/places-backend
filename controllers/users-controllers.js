const { request } = require("express");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const HttpError = require("../models/http-error");
const sharp = require("sharp");
const {
  uploadFile,
  getObjectSignedUrl,
  randomImageName,
} = require("../util/aws-s3");

/**
 * Returns all existing users.
 */
const getUsers = async (req, res, next) => {
  let dbUsers;

  try {
    dbUsers = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Error occurred while fetching royal users.",
      500
    );
    return next(error);
  }

  let users = dbUsers.map((user) => user.toObject({ getters: true }));

  if (users.length > 0) {
    try {
      for (let user of users) {
        const imageUrl = await getObjectSignedUrl(user.image);
        user.image = imageUrl;
      }
    } catch (err) {
      const error = new HttpError(
        "Error occurred while fetching royal users' data.",
        500
      );
      return next(error);
    }
  }

  res.json({ users });
};

/**
 * Throws an HttpError if an account with the entered
 * credentials already exists.
 */
const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid entries, please legitimize data.", 422));
  }

  const { name, email, password } = req.body;

  // check if the user already exists
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "An error has prevented a successful sign-up, try again.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "This email is already being royally used, log-in instead perhaps.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  //hash() returns a promise
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user, please try again", 500);
    return next(error);
  }

  //resize image
  let buffer;
  try {
    buffer = await sharp(req.file.buffer).toBuffer();
  } catch (err) {
    const error = new HttpError(
      "Image processing error has occurred, please try again",
      500
    );
    return next(error);
  }

  const imgName = randomImageName();

  //uploads image to the S3 bucket
  try {
    await uploadFile(buffer, imgName, req.file.mimetype);
  } catch (err) {
    const error = new HttpError(
      "Image failed to upload, please try again",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: imgName,
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Sign-up failed, please try again", 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_TOKEN,
      { expiresIn: "1hr" }
    );
  } catch (err) {
    const error = new HttpError("Sign-up failed, please try again", 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

/**
 * throws an HttpError if credentials do not match any existing
 * account credentials.
 * BUG: upon user creation, credentials are converted into lowwercase characters,
 * so when logging in, uppercase character you signed up with will not be recognized
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  // check if the user exists
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "An error has prevented a successful log-in, try again.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, please try again, my friend.",
      403
    );
    return next(error);
  }

  // making sure there is no server side error during pw-validation operation
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Login unsuccessful, please check your credentials and try again!",
      500
    );
    return next(error);
  }

  // comparing the attempted login password with the existing hashed password
  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, please try again, my friend.",
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_TOKEN,
      { expiresIn: "1hr" }
    );
  } catch (err) {
    const error = new HttpError("login failed, please try again", 500);
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
