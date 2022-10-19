const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * Rule: One 'Place' can only belong to one user.
 * creator property: 
 * the ref attr. establishes the relation between this schema
 * and another schema. Ex: say 'User' and a connection is made w/ User schema.
 * just NoSQL things...
 */
const placeSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: {type: String, required: true },
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User'}
});

module.exports = mongoose.model("Place", placeSchema);