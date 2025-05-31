import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './config/db.js';
import { createTables } from './config/createTable.js';
import { seedData } from './config/seedData.js';
import { generateQRCodesForTables } from './config/qrcodeGen.js';

// Import routes
import tableRouter from './routes/tableRoutes.js';
import AuthRouter from './routes/AuthRoutes.js';
import MenuRouter from './routes/menuRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import sessionRouter from './routes/sessionRoutes.js';
import AnalyticsRouter from './routes/analyticsRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes
app.use('/api/tables', tableRouter);
app.use('/api/auth', AuthRouter);
app.use('/api/menu', MenuRouter);
app.use('/api/orders', orderRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/analytics', AnalyticsRouter);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    // Test database connection and create tables
    await pool.connect();
    console.log('Successfully connected to database');
    await createTables();
    await seedData();

    // Generate QR codes for all tables
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    await generateQRCodesForTables(baseUrl);

    console.log('Database initialization and QR code generation complete');
  } catch (err) {
    console.error('Error during startup:', err.stack);
  }
});
