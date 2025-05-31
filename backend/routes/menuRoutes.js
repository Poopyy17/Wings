import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../config/db.js';

const MenuRouter = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
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

const upload = multer({
  storage: storage,
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

// Serve uploaded images
MenuRouter.get('/items/images/:filename', (req, res) => {
  const { filename } = req.params;
  const imagePath = path.join('uploads/menu-items/', filename);

  if (fs.existsSync(imagePath)) {
    res.sendFile(path.resolve(imagePath));
  } else {
    res.status(404).json({
      success: false,
      message: 'Image not found',
    });
  }
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

// Get menu items by category for Chef Dashboard (including unavailable items)
MenuRouter.get('/categories/:categoryId/items', async (req, res) => {
  try {
    const { categoryId } = req.params;
    // Check if this is for chef dashboard
    const { forChef } = req.query;

    let query = 'SELECT * FROM menu_items WHERE category_id = $1';

    // Only filter for available items if not for chef dashboard
    if (!forChef || forChef !== 'true') {
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
        // Delete uploaded file if menu item doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'Menu item not found',
        });
      }

      // Delete old image if it exists
      if (currentItem.rows[0].image_url) {
        const oldImagePath = currentItem.rows[0].image_url;
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Normalize path separators to forward slashes for URLs
      const normalizedPath = req.file.path.replace(/\\/g, '/');

      // Update menu item with new image URL
      const result = await pool.query(
        'UPDATE menu_items SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [normalizedPath, id]
      );

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error uploading menu item image:', error);
      // Delete uploaded file if there was an error
      if (req.file) {
        fs.unlinkSync(req.file.path);
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
    }

    // Delete image file
    if (fs.existsSync(imageUrl)) {
      fs.unlinkSync(imageUrl);
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
