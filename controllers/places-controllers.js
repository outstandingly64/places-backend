const fs = require('fs');

const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const getCoordsByAddress = require("../util/config");
const Place = require("../models/place");
const User = require('../models/user');

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

  let userPlaces;
  try {
    userPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    const error = new HttpError(`Something went wrong, please try again!`, 500);
    return next(error);
  }

  //rememeber: only ONE response can be sent at a time
  //therefore make sure to use an if/else block
  //or make sure to use 'return' if using if guard clause instead
  if (!userPlaces || userPlaces.places.length === 0) {
    return next(new HttpError(`Could not find any places for this user...`, 404));
  } else {

    //the mongoose find() method returns places in an array
    //but each place needs its getters to still be set to true
    res.json({
      places: userPlaces.places.map((place) => place.toObject({ getters: true })),
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
    image: req.file.path,
    creator,
  });

  // check if the userId of the logged-in user already exists
  let user;
  try {
    user = await User.findById(creator);
  }catch(err){
    const error = new HttpError('Could not find user for provided ID. Try again please!', 500);
    return next(error);
  }

  if(!user){
    const error = new HttpError('Could not find user for provided ID!', 404);
    return next(error);
  }
  
  // console.log(user);

  // if any tasks go wrong in a session, mongodb undoes
  // all changes automatically
  try {
    // goal is to run two async save() operations in one session
    // to ensure transaction commits ONLY when both operations succeed
    const sess = await mongoose.startSession();
    sess.startTransaction();
    //random id is automatically generated by mongoose for place when saving
    await createdPlace.save({ session: sess});
    // now we add the place id to the user.
    // mongoose method push() only establishes relationship to user
    user.places.push(createdPlace); 

    // another task now is to save the user, who was just updated above
    // and is included in the same session we have running
    await user.save({session: sess});
    await sess.commitTransaction();
  } catch (err) {
    // this error may occur when database server is down (or something related)
    // or when the database validation fails
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
    return next(new HttpError("Invalid entries, please legitimize data.", 422)); 
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

  //check if request comes from authorized user
  if(place.creator.toString() !== req.userData.userId){
    const error = new HttpError("You are not allowed to invade (edit) another ruler's place!", 401);
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
const deletePlace = async (req, res, next) => {
  // what place we talking about here? Hence, let's grab.
  // (thanks, URL path)
  const placeId = req.params.pid;

  // GET the place from DB first
  let place;
  try{
    place = await Place.findById(placeId).populate('creator');
  }catch(err){
    const error = new HttpError('An error has prevented the deletion of your place', 500);
    return next(error);
  }

  if(!place){
    const error = new HttpError('Could not find place for the given ID.', 404);
    return next(error);
  }

  if(place.creator.id !== req.userData.userId){
    const error = new HttpError("You are not allowed to conquer (delete) another ruler's place!", 401);
    return next(error);
  }

  const imagePath = place.image;

  // now DELETE the place from DB
  try{
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({session: sess});
    // mongoose method pull() will also interally remove the placeID from user
    place.creator.places.pull(place);
    await place.creator.save({session: sess});
    await sess.commitTransaction();
  }catch(err){
    const error = new HttpError('An error has prevented the deletion of your place', 500);
    return next(error);
  }

  //deleting image also
  fs.unlink(imagePath, err =>{
    console.log(err);
  });

  res.status(200).json({ message: "Successfully relinquished." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
