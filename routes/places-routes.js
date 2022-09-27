const express = require("express");

const router = express.Router();

const DUMMY_PLACES = [
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

router.get("/:pid", (req, res, next) => {
  // this represents the place id in the url
  const placeId = req.params.pid;

  //finds the place that matches the place id in thew url
  const place = DUMMY_PLACES.find((p) => p.id === placeId);

  if (!place) {
    const error = new Error(`Invalid place id: ${placeId}`);
    error.code = 404;
    next(error);
  } else {
    //returns the place that matches the place id from the param url
    res.json({ place: place });
  }
});

router.get("/user/:uid", (req, res, next) => {
  const userId = req.params.uid;
  const place = DUMMY_PLACES.find((p) => p.creator === userId);

  //rememeber: only ONE response can be sent at a time
  //therefore make sure to use an if/else block
  //or make sure to use 'return' if using if guard clause instead
  if (!place) {
    const error = new Error(`Invalid user id: ${userId}`);
    error.code = 404;
    next(error);
  } else {
    //returns the place that matches the user id from the param url
    res.json({ place: place });
  }
});

module.exports = router;
