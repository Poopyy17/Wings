import express from 'express';
import { pool } from '../config/db.js';

const sessionRouter = express.Router();

// Create a new table session
sessionRouter.post('/', async (req, res) => {
  try {
    const { table_id, service_type, occupancy_count } = req.body;

    // Validate request body
    if (!table_id || !service_type || !occupancy_count) {
      return res.status(400).json({
        success: false,
        message: 'Table ID, service type, and occupancy count are required',
      });
    }

    // Calculate unliwings charges if applicable
    let unliwings_base_price = null;
    let unliwings_total_charge = null;

    if (service_type === 'Unliwings') {
      unliwings_base_price = 289; // Base price per person
      unliwings_total_charge = unliwings_base_price * occupancy_count;
    }

    // Create the session
    const result = await pool.query(
      `INSERT INTO table_sessions 
        (table_id, service_type, occupancy_count, status, unliwings_base_price, unliwings_total_charge) 
       VALUES ($1, $2, $3, 'Active', $4, $5) 
       RETURNING *`,
      [
        table_id,
        service_type,
        occupancy_count,
        unliwings_base_price,
        unliwings_total_charge,
      ]
    );

    // Update the table status
    await pool.query('UPDATE tables SET status = $1 WHERE id = $2', [
      'Occupied',
      table_id,
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Table session created successfully',
    });
  } catch (error) {
    console.error('Error creating table session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get all active sessions
sessionRouter.get('/active', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, t.table_number, t.status as table_status
       FROM table_sessions s
       JOIN tables t ON s.table_id = t.id
       WHERE s.status = 'Active'
       ORDER BY s.created_at DESC`
    );

    // For each session, calculate the correct total amount excluding declined orders
    const sessionsWithCorrectTotals = await Promise.all(
      result.rows.map(async (session) => {
        // Calculate total from non-declined orders only
        const totalResult = await pool.query(
          `SELECT COALESCE(SUM(total_amount), 0) as correct_total
           FROM order_tickets 
           WHERE session_id = $1 AND status != 'Declined'`,
          [session.id]
        );

        const correctTotal = parseFloat(totalResult.rows[0].correct_total) || 0;

        return {
          ...session,
          total_amount: correctTotal, // Override with correct total
        };
      })
    );

    res.json({
      success: true,
      data: sessionsWithCorrectTotals,
    });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get specific session by ID
sessionRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT s.*, t.table_number, t.status as table_status
       FROM table_sessions s
       JOIN tables t ON s.table_id = t.id
       WHERE s.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const session = result.rows[0];

    // Calculate correct total amount excluding declined orders
    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as correct_total
       FROM order_tickets 
       WHERE session_id = $1 AND status != 'Declined'`,
      [id]
    );

    const correctTotal = parseFloat(totalResult.rows[0].correct_total) || 0;

    // Override with correct total
    const sessionWithCorrectTotal = {
      ...session,
      total_amount: correctTotal,
    };

    res.json({
      success: true,
      data: sessionWithCorrectTotal,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Process payment for a session
sessionRouter.post('/:id/payment', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { payment_method, processed_by } = req.body;

    await client.query('BEGIN');

    // 1. Get session details
    const sessionResult = await client.query(
      'SELECT * FROM table_sessions WHERE id = $1',
      [id]
    );

    if (sessionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }
    const session = sessionResult.rows[0];

    if (session.is_paid) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Session is already paid',
      });
    } // Calculate total amount including Unli-Wings charges
    // Get correct total from non-declined orders only
    const totalResult = await client.query(
      `SELECT COALESCE(SUM(total_amount), 0) as correct_total
       FROM order_tickets 
       WHERE session_id = $1 AND status != 'Declined'`,
      [id]
    );

    const itemsTotal = parseFloat(totalResult.rows[0].correct_total) || 0;
    const unliwingsCharge = Number(session.unliwings_total_charge) || 0;
    const totalAmountToPay = itemsTotal + unliwingsCharge;

    // 2. Update session status
    await client.query(
      `UPDATE table_sessions
       SET status = 'Paid',
          is_paid = true,
          payment_method = $1,
          payment_date = CURRENT_TIMESTAMP,
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [payment_method, id]
    ); // 3. Create payment record
    await client.query(
      `INSERT INTO payments (session_id, amount_paid, payment_method, processed_by)
       VALUES ($1, $2, $3, $4)`,
      [id, totalAmountToPay, payment_method, processed_by || null]
    );

    // 4. Update table status
    await client.query(
      `UPDATE tables
       SET status = 'Available'
       WHERE id = $1`,
      [session.table_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  } finally {
    client.release();
  }
});

export default sessionRouter;
