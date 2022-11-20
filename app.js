const fs = require('fs');
const path = require('path');

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const userRoutes = require("./routes/user-routes");
const HttpError = require("./models/http-error");

const PLACES_DB_URL = require("./util/databaseUrl");
const { ifError } = require('assert');
const { fields } = require('./middleware/file-upload');

// it is good practice NOT to do the routing
// in this main app.js file...
// would be big if lots of routes

const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next)=>{
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use("/api/places", placesRoutes); // =>/api/places/...

app.use("/api/users", userRoutes);

//error handling for unsupported routes
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if(req.file){
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "An Unknown Error Has Occurred" });
});

mongoose
  .connect(PLACES_DB_URL)
  .then(() => {
    app.listen(process.env.PORT || 5000);
  })
  .catch((err) => {
    console.log(err);
  });
