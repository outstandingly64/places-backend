const express = require('express');
const bodyParser = require('body-parser');


const placesRoutes = require('./routes/places-routes');

// it is good practice NOT to do the routing
// in this main app.js file...
// would be big if lots of routes

const app = express();

app.use('/api/places' ,placesRoutes); // =>/api/places/...

// TODO: Add an error handling middleware function

app.listen(5000)