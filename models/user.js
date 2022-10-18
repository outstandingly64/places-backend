const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// image requires string, because we don't store images in our DB
const userSchema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, minlength: 6},
    image: {type: String, required: true},
    places: {type: String, required: true},
});