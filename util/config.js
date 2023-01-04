const axios = require("axios");

const HttpError = require("../models/http-error");

const API_KEY = process.env.GOOGLE_API_KEY;

/**
 * address (string)
 */
const getCoordsByAddress = async (address) => {
  const response = await axios.get(`
    https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}
    `);

  const data = response.data;

  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError(
      "No location found for said address inquiry.",
      422
    );
    throw error;
  }

  const coordinates = data.results[0].geometry.location;

  return coordinates;
};

//module.exports = PLACES_DB_URL;
module.exports = getCoordsByAddress;