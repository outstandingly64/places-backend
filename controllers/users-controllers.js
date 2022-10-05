const { v4: uuidv4 } = require('uuid');

const HttpError = require('../models/http-error');

const DUMMY_USERS = [
    {
        id: 'u1',
        name: 'Ivan Tello',
        email: 'king@gmail.com',
        password: 'devTestMode'
    }
];

const getUsers = (req, res, next) => {
    res.json({ users: DUMMY_USERS});
};

const signup = (req, res, next) => {
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