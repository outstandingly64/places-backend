const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

// fake data for testing purposes
const DUMMY_USERS = [
    {
        id: 'u1',
        name: 'Ivan Tello',
        email: 'king@gmail.com',
        password: 'devTestMode'
    }
];

/**
 * Returns all existing users.
 */
const getUsers = async (req, res, next) => {
    let users;

    try{
        users = await User.find({}, '-password');
    }catch(err){
        const error = new HttpError('Error occurred while fetching royal users.', 500);
        return next(error);
    }

    res.json({users: users.map(user => user.toObject({getters: true}))});
};

/**
 * Throws an HttpError if an account with the entered
 * credentials already exists.
 */
const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return next(new HttpError('Invalid entries, please legitimize data.', 422)); 
    }

    const { name, email, password } = req.body;

    // check if the user already exists
    let existingUser;
    try{
        existingUser = await User.findOne({email: email});
    }catch(err){
        const error = new HttpError('An error has prevented a successful sign-up, try again.', 500);
        return next(error);
    }

    if(existingUser){
        const error = new HttpError('This email is already being royally used, log-in instead perhaps.', 422);
        return next(error);
    }

    // TODO: storing non-encrypted password is a security issue.
    // TODO: encrpyt password later when the time comes
    // TODO: dynamically assign image src later when the time comes
    const createdUser = new User({
        name,
        email,
        image: 'https://cdn1.iconfinder.com/data/icons/good-life-7/60/prince__crown__avatar__king__goldlife-512.png',
        password,
        places: []
    });

    try {
        await createdUser.save();
      } catch (err) {
        const error = new HttpError("Sign-up failed, please try again", 500);
        return next(error);
      }

    res.status(201).json({user: createdUser.toObject({getters: true})});
};

/**
 * throws an HttpError if credentials do not match any existing
 * account credentials.
 */
const login = async (req, res, next) => {
    const { email, password } = req.body;

    // check if the user exists
    let existingUser;
    try{
        existingUser = await User.findOne({email: email});
    }catch(err){
        const error = new HttpError('An error has prevented a successful log-in, try again.', 500);
        return next(error);
    }

    if(!existingUser || existingUser.password !== password){
        const error = new HttpError('Invalid credentials, please try again.', 401);
        return next(error);
    }

    res.json({message: 'Logged In!'});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;