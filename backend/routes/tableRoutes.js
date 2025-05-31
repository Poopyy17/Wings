import express from 'express';
import { pool } from '../config/db.js';

const tableRouter = express.Router();

// Get all tables
tableRouter.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, table_number, status, qr_code_path FROM tables ORDER BY table_number'
    );

    // Add full URL to QR code path
    const tables = result.rows.map((table) => {
      if (table.qr_code_path) {
        return {
          ...table,
          qr_code_url: `${req.protocol}://${req.get('host')}${
            table.qr_code_path
          }`,
        };
      }
      return table;
    });

    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific table by ID
tableRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM tables WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const table = result.rows[0];

    // Add full URL to QR code path
    if (table.qr_code_path) {
      table.qr_code_url = `${req.protocol}://${req.get('host')}${
        table.qr_code_path
      }`;
    }

    res.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a table status
tableRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE tables SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Table not found' });
    }

    const table = result.rows[0];

    // Add full URL to QR code path
    if (table.qr_code_path) {
      table.qr_code_url = `${req.protocol}://${req.get('host')}${
        table.qr_code_path
      }`;
    }

    res.json(table);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

tableRouter.put('/:tableId/status', async (req, res) => {
  try {
    const { tableId } = req.params;
    const { status } = req.body;

    if (!status || !['Available', 'Occupied', 'For Payment'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const result = await pool.query(
      `UPDATE tables
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, tableId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Table status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default tableRouter;
