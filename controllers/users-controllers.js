const { request } = require("express");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const HttpError = require("../models/http-error");
const User = require("../models/user");

/**
 * Returns all existing users.
 */
const getUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Error occurred while fetching royal users.",
      500
    );
    return next(error);
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
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

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Sign-up failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
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
      401
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
      401
    );
    return next(error);
  }

  // TODO: generate token after valid email & password check

  res.json({
    message: "Logged In!",
    user: existingUser.toObject({ getters: true }),
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
