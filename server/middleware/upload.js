const multer = require('multer');
const path = require('path');
const ErrorResponse = require('../utils/ErrorResponse');

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed image types
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  // Allowed video types
  const videoTypes = /mp4|webm|mov|avi/;

  const extname = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = file.mimetype;

  if (file.fieldname === 'video') {
    if (videoTypes.test(extname) && mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new ErrorResponse('Only video files (mp4, webm, mov) are allowed', 400), false);
    }
  } else {
    if (imageTypes.test(extname) && mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new ErrorResponse('Only image files (jpeg, jpg, png, gif, webp) are allowed', 400), false);
    }
  }
};

// Upload middleware instances
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Single image upload (avatar, cover)
const uploadSingle = upload.single('image');

// Multiple images upload (post images, up to 4)
const uploadMultiple = upload.array('images', 4);

// Mixed upload (images + video for posts)
const uploadPostMedia = upload.fields([
  { name: 'images', maxCount: 4 },
  { name: 'video', maxCount: 1 }
]);

// Wrapper to handle multer errors gracefully
const handleUpload = (uploadFn) => {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ErrorResponse('File too large. Maximum size is 10MB.', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new ErrorResponse('Too many files. Maximum is 4 images.', 400));
        }
        return next(new ErrorResponse(err.message, 400));
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  uploadSingle: handleUpload(uploadSingle),
  uploadMultiple: handleUpload(uploadMultiple),
  uploadPostMedia: handleUpload(uploadPostMedia)
};
