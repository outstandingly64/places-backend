const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

/**
 * Rule: One 'User' can have multiple places.
 * Thus, 'places' is an array of places objects. 
 * The ref attr. establishes the relation between this schema
 * and another schema. Ex: say 'Place' and a connection is made w/ Place schema.
 * Also, image prop requires string, because we don't store images in our DB.
 */
const userSchema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true, minlength: 6},
    image: {type: String, required: true},
    places: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Place'}],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);