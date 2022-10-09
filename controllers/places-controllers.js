const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const getCoordinates = require("../util/config");

// We have no database at this point in development,
// so we use dummy (fake) data, for now.
let DUMMY_PLACES = [
  {
    id: "p1",
    title: "Tenochtitlan",
    description:
      "The city was built on an island in what was then Lake Texcoco in the Valley of Mexico. The city was the capital of the expanding Aztec Empire in the 15th century until it was captured by the Spanish in 1521. At its peak, it was the largest city in the pre-Columbian Americas.",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/El_templo_mayor_en_Tenochtitlan.png/800px-El_templo_mayor_en_Tenochtitlan.png",
    address:
      "Historic center of Mexico City, Centro, Mexico City, CDMX, Mexico",
    location: {
      lat: 19.4337383,
      lng: -99.1454316,
    },
    creator: "u1",
  },
];

/**
 * returns the place that matches the place id.
 */
const getPlaceById = (req, res, next) => {
  // this represents the place id in the url
  const placeId = req.params.pid;

  //finds the place that matches the place id in thew url
  const place = DUMMY_PLACES.find((p) => p.id === placeId);

  if (!place) {
    throw new HttpError(`Invalid place id: ${placeId}`, 404);
  } else {
    //returns the place that matches the place id from the param url
    res.json({ place: place });
  }
};

/**
 * Returns all places that match respective userId.
 */
const getPlacesByUserId = (req, res, next) => {
  const userId = req.params.uid;
  const places = DUMMY_PLACES.filter((p) => p.creator === userId);

  //rememeber: only ONE response can be sent at a time
  //therefore make sure to use an if/else block
  //or make sure to use 'return' if using if guard clause instead
  if (!places || places.length === 0) {
    next(new HttpError(`Could not find any places for: ${userId}`, 404));
  } else {
    //returns the place that matches the user id from the param url
    res.json({ places });
  }
};

/**
 * Creates a new place.
 */
const createPlace = async (req, res, next) => {
  // validate incoming request for errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
   return next(new HttpError("Invalid entries, please legitimize data.", 422));
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordinates(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = {
    id: uuidv4(),
    title: title,
    description: description,
    location: coordinates,
    address: address,
    creator: creator,
  };

  DUMMY_PLACES.push(createdPlace);

  //status code 201 denotes successful CREATION of something
  res.status(201).json({ place: createdPlace });
};

/**
 * validates, extracts incoming request body properties and
 * creates an (new) updated place object which replaces the
 * previous un-updated place object in question.
 */
const updatePlace = (req, res, next) => {
  // check & validate incoming inputs before updating the place
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid entries, please legitimize data.", 422);
  }

  // desrtucture/extract properties from incoming request body
  const { title, description } = req.body;
  const placeId = req.params.pid;

  // we're not just updating the properties in question only:
  // update is to return complete new place object that reflects
  // that existing place object WITH the updated properties
  const updatedPlace = { ...DUMMY_PLACES.find((p) => p.id === placeId) };

  // index needed in order to replace place object in question
  // correctly with the (new) updated place object later
  const placeIndex = DUMMY_PLACES.findIndex((p) => p.id === placeId);

  // designate the validated request body properties
  // as part of the (new) updated place object
  updatedPlace.title = title;
  updatedPlace.description = description;

  // we now replace the existing place object with
  // the (new) UPDATED place object
  DUMMY_PLACES[placeIndex] = updatedPlace;

  res.status(200).json({ place: updatedPlace });
};

/**
 * Checks if place exists before filtering it out
 * of our existing places array, thus, deleting the place in question
 */
const deletePlace = (req, res, next) => {
  // what place we talking about here? Hence, let's grab.
  // (thanks, URL path)
  const placeId = req.params.pid;

  // check if place exists before deleting
  if (!DUMMY_PLACES.find((p) => p.id === placeId)) {
    throw new HttpError("Could not find a place that matches that id.", 404);
  }

  // places array replaced by (new) updated place array
  // this essentially deletes the place in question
  DUMMY_PLACES = DUMMY_PLACES.filter((p) => p.id !== placeId);

  res.status(200).json({ message: "Successfully relinquished." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
