const { v4: uuidv4 } = require('uuid');

const HttpError = require('../models/http-error');

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

  const getPlacesByUserId = (req, res, next) => {
    const userId = req.params.uid;
    const places = DUMMY_PLACES.filter((p) => p.creator === userId);
  
    //rememeber: only ONE response can be sent at a time
    //therefore make sure to use an if/else block
    //or make sure to use 'return' if using if guard clause instead
    if (!places || places.length === 0) {
      next(new HttpError(`Could not find any places for: ${userId}`, 404))
    } else {
      //returns the place that matches the user id from the param url
      res.json({ places });
    }
  }

  const createPlace = (req, res, next) => {
    const { title, description, coordinates, address, creator} = req.body;

    const createdPlace = {
        id: uuidv4(),
        title: title,
        description: description,
        location: coordinates,
        address: address,
        creator: creator
    };

    DUMMY_PLACES.push(createdPlace);

    //status code 201 denotes successful CREATION of something
    res.status(201).json({place: createdPlace});
  };

  const updatePlace = (req, res, next) => {
    const { title, description } = req.body;
    const placeId = req.params.pid;

    const updatedPlace = {...DUMMY_PLACES.find(p => p.id === placeId)};
    const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId);
    updatedPlace.title = title;
    updatedPlace.description = description;

    DUMMY_PLACES[placeIndex] = updatedPlace;

    res.status(200).json({place: updatedPlace});
  };

  const deletePlace = (req, res, next) => {
    const placeId = req.params.pid;
    DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);
    res.status(200).json({message: "Successfully relinquished."});
  };

  exports.getPlaceById = getPlaceById;
  exports.getPlacesByUserId = getPlacesByUserId;
  exports.createPlace = createPlace;
  exports.updatePlace = updatePlace;
  exports.deletePlace = deletePlace;

