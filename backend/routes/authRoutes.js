import express from 'express';
import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

const AuthRouter = express.Router();

// Login route
AuthRouter.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate request body
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and role are required',
      });
    }

    // Check if user exists with the specified role
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND role = $2',
      [username, role]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or role',
      });
    }

    const user = userResult.rows[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Return user info without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
});

// Verify auth status route
AuthRouter.get('/verify', async (req, res) => {
  // This would normally check a JWT token in the Authorization header
  // For this simple implementation, we're just returning success: false
  // In a real app, you would implement JWT token verification here

  res.status(200).json({
    success: false,
    message: 'User is not authenticated',
  });
});

export default AuthRouter;
