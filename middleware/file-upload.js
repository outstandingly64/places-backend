const multer = require("multer");
const storage = multer.memoryStorage();

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

/**
 * Filter middleware that only accepts image files
 * of mimetypes png, jpeg and jpg.
 */
const mimetypeFilter = (req, file, cb) => {
  const isValid = !!MIME_TYPE_MAP[file.mimetype];
  let error = isValid ? null : new Error("Invalid mime type!");
  cb(error, isValid);
};

/**
 * Processes binary image file upload, holds it in
 * Multer memory storage. Accepts images of type 
 * png, jpeg and jpg.
 */
const fileUpload = multer({
  storage: storage,
  fileFilter: mimetypeFilter,
});

module.exports = fileUpload;
