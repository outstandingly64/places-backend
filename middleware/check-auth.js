const jwt = require('jsonwebtoken');
const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
    // ensures OPTIONS request is not blocked
    if(req.method === 'OPTIONS'){
        return next();
    }
  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'

    if (!token) {
      throw new Error('Authentication unsuccessful!');
    }
    //validate token -- returns a payload object instead of boolean
    const decodedToken = jwt.verify(token, 'topsecretdocs');
    // once valid, let the request continue and add data to the request
    req.userData = { userId: decodedToken.userId};
    next();

  } catch (err) {
    const error = new HttpError("Authentication unsuccessful!", 401);
      return next(error);
  }
};
