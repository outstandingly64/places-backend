const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

/**
 * Generates a unique image for image being uploaded to
 * allow duplicate images and prevent overwriting existing images
 * in S3 Bucket.
 * Optional argument: bytes, defaults to 32.
 */
exports.randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const s3Client = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
});

/**
 * Uploads an image to S3 Bucket.
 * Requires three arguments: the file buffer, the filename, and the
 * file's mimetype.
 */
exports.uploadFile = (fileBuffer, fileName, mimetype) => {
  const uploadParams = {
    Bucket: bucketName,
    Body: fileBuffer,
    Key: fileName,
    ContentType: mimetype,
  };

  return s3Client.send(new PutObjectCommand(uploadParams));
};

/**
 * Deletes image from S3 Bucket
 * Requires one argument: the file name.
 */
exports.deleteFile = (fileName) => {
  const deleteParams = {
    Bucket: bucketName,
    Key: fileName,
  };

  return s3Client.send(new DeleteObjectCommand(deleteParams));
};

/**
 * Returns a temporary image link to view image that is stored in S3 Bucket.
 * Requires one arguement: the image name.
 */
exports.getObjectSignedUrl = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  const command = new GetObjectCommand(params);
  const seconds = 900;
  const url = await getSignedUrl(s3Client, command, { expiresIn: seconds });

  return url;
};
