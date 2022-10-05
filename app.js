const express = require('express');
const bodyParser = require('body-parser');


const placesRoutes = require('./routes/places-routes');
const userRoutes = require('./routes/user-routes');
const HttpError = require('./models/http-error');

// it is good practice NOT to do the routing
// in this main app.js file...
// would be big if lots of routes

const app = express();

app.use(bodyParser.json());

app.use('/api/places' ,placesRoutes); // =>/api/places/...

app.use('/api/users', userRoutes);

//error handling for unsupported routes
app.use((req, res, next)=>{
    const error = new HttpError('Could not find this route', 404);
    throw error;
});

app.use((error, req, res, next)=>{
    if(res.headerSent){
        return next(error);
    }

    res.status(error.code || 500)
    res.json({message: error.message || "An Unknown Error Has Occurred"});
});

app.listen(5000)