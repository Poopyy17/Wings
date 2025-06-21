import express from 'express';
import fs from 'fs';
import { pool } from '../config/db.js';
import {
  upload,
  uploadToBlob,
  getImageUrl,
  serveLocalImage,
  deleteFromBlob,
} from '../config/storage.js';

const MenuRouter = express.Router();

// Serve uploaded images (only for development)
MenuRouter.get('/items/images/:filename', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, images are served directly from Vercel Blob
    return res.status(404).json({
      success: false,
      message: 'Images are served from blob storage in production',
    });
  }

  const { filename } = req.params;
  serveLocalImage(filename, res);
});

// Get all menu categories
MenuRouter.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM menu_categories ORDER BY display_order'
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching menu categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get menu items by category (including unavailable items for staff/customer viewing)
MenuRouter.get('/categories/:categoryId/items', async (req, res) => {
  try {
    const { categoryId } = req.params;
    // Check if this includes unavailable items (for chef dashboard or customer viewing)
    const { forChef, includeUnavailable } = req.query;

    let query = 'SELECT * FROM menu_items WHERE category_id = $1';

    // Only filter for available items if not for chef dashboard or customer viewing
    if (
      (!forChef || forChef !== 'true') &&
      (!includeUnavailable || includeUnavailable !== 'true')
    ) {
      query += ' AND is_available = true';
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, [categoryId]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get all menu items
MenuRouter.get('/items', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM menu_items WHERE is_available = true ORDER BY category_id, name'
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching all menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get all wing flavors for Chef Dashboard (including unavailable ones)
MenuRouter.get('/flavors', async (req, res) => {
  try {
    const { forChef } = req.query;

    let query = 'SELECT * FROM wing_flavors';

    // Only filter for available items if not for chef dashboard
    if (!forChef || forChef !== 'true') {
      query += ' WHERE is_available = true';
    }

    query += ' ORDER BY name';

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching wing flavors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Upload image for menu item
MenuRouter.post(
  '/items/:id/upload-image',
  upload.single('image'),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
        });
      }

      // Get current menu item to check if it has an existing image
      const currentItem = await pool.query(
        'SELECT image_url FROM menu_items WHERE id = $1',
        [id]
      );

      if (currentItem.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found',
        });
      }

      let imageUrl;

      if (process.env.NODE_ENV === 'production') {
        // Upload to Vercel Blob in production
        const blobResult = await uploadToBlob(req.file);

        if (!blobResult.success) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload image to blob storage',
            error: blobResult.error,
          });
        }

        imageUrl = blobResult.url;
      } else {
        // Use local file path in development
        // Normalize path separators to forward slashes for URLs
        imageUrl = req.file.path.replace(/\\/g, '/');
      } // Delete old image if it exists
      const oldImageUrl = currentItem.rows[0].image_url;
      if (oldImageUrl) {
        if (process.env.NODE_ENV === 'production') {
          // Delete from Vercel Blob storage in production
          if (oldImageUrl.startsWith('http')) {
            const deleteResult = await deleteFromBlob(oldImageUrl);
            if (!deleteResult.success) {
              console.warn(
                'Failed to delete old image from blob storage:',
                deleteResult.error
              );
              // Continue with upload even if old image deletion fails
            }
          }
        } else {
          // Delete local file in development
          if (fs.existsSync(oldImageUrl)) {
            fs.unlinkSync(oldImageUrl);
          }
        }
      }

      // Update menu item with new image URL
      const result = await pool.query(
        'UPDATE menu_items SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [imageUrl, id]
      );

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error uploading menu item image:', error);
      // Delete uploaded file if there was an error (only in development)
      if (req.file && process.env.NODE_ENV !== 'production') {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// Update menu item availability
MenuRouter.patch('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    // Validate request
    if (is_available === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing is_available field',
      });
    }

    // Update the item
    const result = await pool.query(
      'UPDATE menu_items SET is_available = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [is_available, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    res.json({
      success: true,
      message: 'Menu item availability updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating menu item availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Update wing flavor availability
MenuRouter.patch('/flavors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    // Validate request
    if (is_available === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing is_available field',
      });
    }

    // Update the flavor - without updated_at column
    const result = await pool.query(
      'UPDATE wing_flavors SET is_available = $1 WHERE id = $2 RETURNING *',
      [is_available, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Wing flavor not found',
      });
    }

    res.json({
      success: true,
      message: 'Wing flavor availability updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating wing flavor availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Delete image for menu item
MenuRouter.delete('/items/:id/delete-image', async (req, res) => {
  try {
    const { id } = req.params;

    // Get current menu item to check if it has an image
    const currentItem = await pool.query(
      'SELECT image_url FROM menu_items WHERE id = $1',
      [id]
    );

    if (currentItem.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    const imageUrl = currentItem.rows[0].image_url;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'No image to delete',
      });
    } // Delete image file based on environment
    if (process.env.NODE_ENV === 'production') {
      // Delete from Vercel Blob storage in production
      if (imageUrl.startsWith('http')) {
        const deleteResult = await deleteFromBlob(imageUrl);
        if (!deleteResult.success) {
          console.warn(
            'Failed to delete image from blob storage:',
            deleteResult.error
          );
          // Continue with database update even if blob deletion fails
        }
      }
    } else {
      // Delete local file in development
      if (fs.existsSync(imageUrl)) {
        fs.unlinkSync(imageUrl);
      }
    }

    // Update menu item to remove image URL
    const result = await pool.query(
      'UPDATE menu_items SET image_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting menu item image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default MenuRouter;
