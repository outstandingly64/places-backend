const PLACES_DB_URL =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ym50pep.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

module.exports = PLACES_DB_URL;