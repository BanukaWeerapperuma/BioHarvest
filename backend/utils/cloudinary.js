import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dvdmmxa0k',
  api_key: process.env.CLOUDINARY_API_KEY || '981344464146576',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'vRWBBozvmAV--8akGO1Qsl16exg'
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} folder - The folder path in Cloudinary (e.g., 'courses', 'users', 'food', 'blog')
 * @param {string} resourceType - 'image' or 'raw' (for PDFs)
 * @param {string} originalName - Original filename for naming
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = async (fileBuffer, folder, resourceType = 'image', originalName = '') => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
      overwrite: false
    };

    // For raw files (PDFs), add specific options
    if (resourceType === 'raw') {
      uploadOptions.format = 'pdf';
    }

    // Convert buffer to stream
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Create readable stream from buffer
    const readableStream = Readable.from(fileBuffer);
    readableStream.pipe(stream);
  });
};

/**
 * Upload a file from multer file object
 * @param {Object} file - Multer file object (req.file or req.files[field][0])
 * @param {string} folder - The folder path in Cloudinary
 * @param {string} resourceType - 'image' or 'raw' (for PDFs)
 * @returns {Promise<Object>} Cloudinary upload result with URL
 */
export const uploadFile = async (file, folder, resourceType = 'image') => {
  try {
    if (!file || !file.buffer) {
      throw new Error('File buffer is required');
    }

    const result = await uploadToCloudinary(
      file.buffer,
      folder,
      resourceType,
      file.originalname
    );

    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public_id of the file in Cloudinary
 * @param {string} resourceType - 'image' or 'raw' (for PDFs)
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    if (!publicId) {
      return { result: 'not found' };
    }

    // Extract public_id from URL if full URL is provided
    let extractedPublicId = publicId;
    if (publicId.includes('cloudinary.com')) {
      const urlParts = publicId.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1) {
        const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
        extractedPublicId = pathAfterUpload.split('.')[0];
      }
    }

    const result = await cloudinary.uploader.destroy(extractedPublicId, {
      resource_type: resourceType
    });

    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} Public ID
 */
export const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex !== -1) {
      const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
      return pathAfterUpload.split('.')[0];
    }
  } catch (error) {
    console.error('Error extracting public_id:', error);
  }

  return null;
};

export default cloudinary;

