import { put, del } from '@vercel/blob';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Local storage configuration for development
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/menu-items/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'menu-item-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Memory storage for production (will be uploaded to Vercel Blob)
const memoryStorage = multer.memoryStorage();

// Configure multer based on environment
export const upload = multer({
  storage: process.env.NODE_ENV === 'production' ? memoryStorage : localStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Upload file to Vercel Blob storage
export const uploadToBlob = async (file) => {
  try {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename =
      'menu-item-' + uniqueSuffix + path.extname(file.originalname);

    // Create organized path with menu_items folder
    const blobPath = `menu_items/${filename}`;

    const blob = await put(blobPath, file.buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return {
      success: true,
      url: blob.url,
      filename: filename,
    };
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Delete file from Vercel Blob storage
export const deleteFromBlob = async (imageUrl) => {
  try {
    // Extract the blob URL for deletion
    // The imageUrl should be a full blob URL like: https://...blob.vercel-storage.com/menu_items/filename.jpg

    if (!imageUrl || !imageUrl.startsWith('http')) {
      return {
        success: false,
        error: 'Invalid blob URL provided',
      };
    }

    await del(imageUrl, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return {
      success: true,
      message: 'File deleted from blob storage successfully',
    };
  } catch (error) {
    console.error('Error deleting from Vercel Blob:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get image URL based on environment
export const getImageUrl = (filename, req) => {
  if (process.env.NODE_ENV === 'production') {
    // For production, return the blob URL directly if it's already a full URL
    if (filename && filename.startsWith('http')) {
      return filename;
    }
    // If it's just a filename, construct blob URL (this shouldn't happen in normal flow)
    return filename;
  } else {
    // For development, return local server URL
    return `${req.protocol}://${req.get(
      'host'
    )}/api/menu/items/images/${filename}`;
  }
};

// Serve local images in development
export const serveLocalImage = (filename, res) => {
  const imagePath = path.join('uploads/menu-items/', filename);

  if (fs.existsSync(imagePath)) {
    res.sendFile(path.resolve(imagePath));
  } else {
    res.status(404).json({
      success: false,
      message: 'Image not found',
    });
  }
};
