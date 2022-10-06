const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');

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
 * Returns existing users.
 */
const getUsers = (req, res, next) => {
    res.json({ users: DUMMY_USERS});
};

/**
 * Throws an HttpError if an account with the entered
 * credentials already exists.
 */
const signup = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      throw new HttpError('Invalid entries, please legitimize data.', 422);
    }

    const { name, email, password } = req.body;

    const userAlreadyExists = DUMMY_USERS.find(u => u.email === email);
    if(userAlreadyExists){
        throw new HttpError('Sorry, that email is already associated with another account.');
    }

    const createdUser = {
        id: uuidv4(),
        name, //name: name,
        email, //email: email,
        password //password: password
    };

    DUMMY_USERS.push(createdUser);

    res.status(201).json({user: createdUser});
};

/**
 * throws an HttpError if credentials do not match any existing
 * account credentials.
 */
const login = (req, res, next) => {
    const { email, password } = req.body;

    //Not the final authentication logic
    const identifiedUser = DUMMY_USERS.find(u => u.email === email);
    if(!identifiedUser || identifiedUser.password !== password){
        throw new HttpError('Could not identify user, please enter correct credentials', 401);
    }

    res.json({message: 'Logged In!'});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;