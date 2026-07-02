const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Process and compress an image
 * @param {string} filePath - Path to the uploaded image
 * @param {Object} options - Processing options
 * @returns {string} - Path to the processed image
 */
const processImage = async (filePath, options = {}) => {
  const {
    width = 1200,
    height = null,
    quality = 80,
    format = 'jpeg'
  } = options;

  const ext = `.${format}`;
  const filename = `processed-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
  const outputPath = path.join(uploadsDir, filename);

  try {
    let sharpInstance = sharp(filePath);

    // Resize if dimensions provided
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert and compress
    if (format === 'jpeg' || format === 'jpg') {
      sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality });
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    }

    await sharpInstance.toFile(outputPath);

    // Delete original file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Image processing error:', error);
    // If processing fails, return original path
    return `/uploads/${path.basename(filePath)}`;
  }
};

/**
 * Create avatar thumbnail
 */
const processAvatar = async (filePath) => {
  return processImage(filePath, {
    width: 400,
    height: 400,
    quality: 85,
    format: 'jpeg'
  });
};

/**
 * Process cover image
 */
const processCover = async (filePath) => {
  return processImage(filePath, {
    width: 1500,
    height: 500,
    quality: 85,
    format: 'jpeg'
  });
};

/**
 * Process post image
 */
const processPostImage = async (filePath) => {
  return processImage(filePath, {
    width: 1200,
    quality: 80,
    format: 'jpeg'
  });
};

module.exports = {
  processImage,
  processAvatar,
  processCover,
  processPostImage
};
