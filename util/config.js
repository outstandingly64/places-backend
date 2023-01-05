const axios = require("axios");

const HttpError = require("../models/http-error");

// LOCATION IQ API Token
const API_KEY = process.env.LOCATION_IQ_API_TOKEN;

/**
 * address (string)
 */
const getCoordsByAddress = async (address) => {
  const response = await axios.get(
    `https://us1.locationiq.com/v1/search.php?key=${API_KEY}&q=${encodeURIComponent(
      address
    )}&format=json`
  );

  const data = response.data[0];

  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError(
      "No location found for said address inquiry.",
      422
    );
    throw error;
  }

  const { lat, lon } = data;
  const coordinates = {
    lat,
    lng: lon,
  };

  return coordinates;
};

module.exports = getCoordsByAddress;
