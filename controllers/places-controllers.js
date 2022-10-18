const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const getCoordsByAddress = require("../util/config");
const Place = require("../models/place");

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
 * returns the place that matches the place id in our DB.
 */
const getPlaceById = async (req, res, next) => {
  // this represents the place id in the url
  const placeId = req.params.pid;

  let place;
  try {
    //finds the place in the database that matches the place id in the url
    //block scoping error: do not define place in try block.
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Something went wrong, my royal heiness.", 500);
    return next(error);
  }

  if (!place) {
    const error = new HttpError(`Invalid place id: ${placeId}`, 404);
    return next(error);
  }

  //must turn mongoose object into normal js object, thus .toObject()
  //eliminate underscore in ID for cleaner retrieval by setting getters option to true
  res.json({ place: place.toObject({ getters: true }) });
};

/**
 * Returns all places that match respective userId.
 */
const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(`Something went wrong, please try again!`, 500);
    return next(error);
  }

  //rememeber: only ONE response can be sent at a time
  //therefore make sure to use an if/else block
  //or make sure to use 'return' if using if guard clause instead
  if (!places || places.length === 0) {
    next(new HttpError(`Could not find any places for: ${userId}`, 404));
  } else {

    //the mongoose find() method returns places in an array
    //but each place needs its getters to still be set to true
    res.json({
      places: places.map((place) => place.toObject({ getters: true })),
    });
  }
};

/**
 * Async function, creates a new place.
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
    coordinates = await getCoordsByAddress(address);
  } catch (error) {
    console.log(error);
    return next(error);
  }

  // TODO: current image url is hardcoded: we don't have image upload yet.
  /**
   * a new place, created using the Place schema & model.
   */
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image:
      "https://www.strongdm.com/hubfs/Technology%20Images/603c5eb831820c3ce6a8f057_603a1586fa052d17fc2a6929_MongoDBAtlas.png",
    creator,
  });

  try {
    await createdPlace.save();
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again", 500);
    return next(error);
  }

  //status code 201 denotes successful CREATION of something
  res.status(201).json({ place: createdPlace });
};

/**
 * validates, extracts incoming request body properties and
 * creates an (new) updated place object which replaces the
 * previous un-updated place object in question.
 */
const updatePlace = async (req, res, next) => {
  // check & validate incoming inputs before updating the place
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid entries, please legitimize data.", 422);
  }

  // desrtucture/extract properties from incoming request body
  const { title, description } = req.body;
  const placeId = req.params.pid;

  // GET the place in question if it exists
  let place;
  try{
    place = await Place.findById(placeId);
  }catch(err){
    const error = new HttpError('An error has prevented your royal place from updating', 500);
    return next(error);
  }

  // designate the validated request body properties
  // as part of the (new) updated place object
  place.title = title;
  place.description = description;

  //store (save) the updated place's information
  try{
    await place.save();
  }catch(err){
    const error = new HttpError('An error has prevented your royal place from updating', 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({getters: true}) });
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
