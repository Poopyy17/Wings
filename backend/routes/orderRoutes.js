import express from 'express';
import { pool } from '../config/db.js';
import { format } from 'date-fns';

const orderRouter = express.Router();

// Create a new order ticket with items
orderRouter.post('/tickets', async (req, res) => {
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    const { sessionId, items, isTakeout = false } = req.body;

    if (!sessionId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid request data. SessionId and items array are required.',
      });
    }

    // Generate unique ticket number based on date and random digits
    const date = format(new Date(), 'yyMMdd');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    const ticketNumber = `T${date}-${random}`;

    // Calculate total amount from items
    const totalAmount = items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    // 1. Create ticket
    const ticketResult = await client.query(
      `INSERT INTO order_tickets 
        (session_id, is_takeout, ticket_number, status, total_amount) 
       VALUES ($1, $2, $3, 'Pending', $4)
       RETURNING *`,
      [sessionId, isTakeout, ticketNumber, totalAmount]
    );

    const ticketId = ticketResult.rows[0].id;

    // 2. Add items to the ticket
    for (const item of items) {
      // Special handling for Unliwings items with ID 9999 (which doesn't exist in the database)
      const isSpecialUnliwings = item.id === 9999 || item.isUnliwings;

      // For Unliwings items, we'll set menu_item_id to NULL since it's not a real menu item
      // Otherwise, we'll use the actual menu_item_id
      const menuItemId = isSpecialUnliwings ? null : item.id;

      // Insert order item
      const orderItemResult = await client.query(
        `INSERT INTO order_items
          (ticket_id, menu_item_id, item_name, unit_price, quantity, subtotal, is_unliwings, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          ticketId,
          menuItemId,
          item.name,
          item.price,
          item.quantity,
          item.price * item.quantity,
          isSpecialUnliwings,
          item.notes || null,
        ]
      );

      const orderItemId = orderItemResult.rows[0].id;

      // If it's a wing item with flavors, add flavor information
      if (item.flavors && item.flavors.length > 0) {
        for (const flavorName of item.flavors) {
          // Get flavor ID by name
          const flavorResult = await client.query(
            'SELECT id FROM wing_flavors WHERE name = $1',
            [flavorName]
          );

          if (flavorResult.rows.length > 0) {
            const flavorId = flavorResult.rows[0].id;

            // Insert order item flavor
            await client.query(
              `INSERT INTO order_item_flavors
                (order_item_id, flavor_id, quantity)
               VALUES ($1, $2, $3)`,
              [orderItemId, flavorId, 1] // Default quantity to 1 for now
            );

            // Update flavor order count
            await client.query(
              `UPDATE wing_flavors 
               SET order_count = order_count + 1
               WHERE id = $1`,
              [flavorId]
            );
          }
        }
      }

      // Only update menu item order count for real menu items
      if (!isSpecialUnliwings) {
        await client.query(
          `UPDATE menu_items
           SET order_count = order_count + $1
           WHERE id = $2`,
          [item.quantity, item.id]
        );
      }
    }

    // 3. Update session total amount
    await client.query(
      `UPDATE table_sessions
       SET total_amount = total_amount + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [totalAmount, sessionId]
    );

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        ticketId: ticketId,
        ticketNumber: ticketNumber,
        totalAmount: totalAmount,
      },
    });
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating order',
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// Create a take-out order (no session required)
orderRouter.post('/takeout', async (req, res) => {
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data. Items array is required.',
      });
    }

    // Generate unique order number for take-out orders
    const date = format(new Date(), 'yyMMdd');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    const orderNumber = `TO${date}-${random}`;

    // Calculate total amount from items
    const totalAmount = items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    // 1. Create take-out order (using the same ticket system with is_takeout=true)
    const ticketResult = await client.query(
      `INSERT INTO order_tickets 
        (session_id, is_takeout, ticket_number, status, total_amount) 
       VALUES (NULL, true, $1, 'Pending', $2)
       RETURNING *`,
      [orderNumber, totalAmount]
    );

    const ticketId = ticketResult.rows[0].id;

    // 2. Add items to the ticket
    for (const item of items) {
      // For items with menu_item_id but no name, fetch the name from the menu_items table
      let itemName = item.name;

      if (!itemName && item.menu_item_id) {
        // Fetch the name from the database if it wasn't provided
        const menuItemResult = await client.query(
          'SELECT name FROM menu_items WHERE id = $1',
          [item.menu_item_id]
        );

        if (menuItemResult.rows.length > 0) {
          itemName = menuItemResult.rows[0].name;
        } else {
          // If menu item doesn't exist, use a placeholder
          itemName = `Item #${item.menu_item_id}`;
        }
      } else if (!itemName) {
        // If there's no name and no menu_item_id, use a generic name
        itemName = 'Unnamed Item';
      }

      // Insert order item
      const orderItemResult = await client.query(
        `INSERT INTO order_items
          (ticket_id, menu_item_id, item_name, unit_price, quantity, subtotal, is_unliwings, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          ticketId,
          item.menu_item_id,
          itemName,
          item.price,
          item.quantity,
          item.price * item.quantity,
          item.is_unliwings || false,
          item.notes || null,
        ]
      );

      const orderItemId = orderItemResult.rows[0].id;

      // If it's a wing item with flavors, add flavor information
      if (item.flavors && item.flavors.length > 0) {
        for (const flavorName of item.flavors) {
          // Get flavor ID by name
          const flavorResult = await client.query(
            'SELECT id FROM wing_flavors WHERE name = $1',
            [flavorName]
          );

          if (flavorResult.rows.length > 0) {
            const flavorId = flavorResult.rows[0].id;

            // Insert order item flavor
            await client.query(
              `INSERT INTO order_item_flavors
                (order_item_id, flavor_id, quantity)
               VALUES ($1, $2, $3)`,
              [orderItemId, flavorId, 1] // Default quantity to 1 for now
            );

            // Update flavor order count
            await client.query(
              `UPDATE wing_flavors 
               SET order_count = order_count + 1
               WHERE id = $1`,
              [flavorId]
            );
          }
        }
      }

      // Update menu item order count
      if (item.menu_item_id) {
        await client.query(
          `UPDATE menu_items
           SET order_count = order_count + $1
           WHERE id = $2`,
          [item.quantity, item.menu_item_id]
        );
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Take-out order created successfully',
      data: {
        id: ticketId,
        orderNumber: orderNumber,
        totalAmount: totalAmount,
      },
    });
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error creating take-out order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating take-out order',
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// Process payment for a take-out order
orderRouter.post('/takeout/:orderId/payment', async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderId } = req.params;
    const { payment_method, processed_by } = req.body;

    await client.query('BEGIN');

    // 1. Get order details
    const orderResult = await client.query(
      `SELECT * FROM order_tickets 
       WHERE id = $1 AND is_takeout = true`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Take-out order not found',
      });
    }

    const order = orderResult.rows[0];

    // 2. Update order status
    await client.query(
      `UPDATE order_tickets
       SET status = 'Completed',
          updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [orderId]
    );

    // 3. Create payment record
    await client.query(
      `INSERT INTO payments (take_out_order_id, amount_paid, payment_method, processed_by)
       VALUES ($1, $2, $3, $4)`,
      [orderId, order.total_amount, payment_method, processed_by || null]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Take-out payment processed successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing take-out payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  } finally {
    client.release();
  }
});

// Get all completed orders (both dine-in and take-out)
orderRouter.get('/completed', async (req, res) => {
  const client = await pool.connect();

  try {
    const { startDate, endDate, limit = 50 } = req.query;

    let query = `
      SELECT 
        ot.*,
        ts.table_id,
        CASE 
          WHEN ot.is_takeout = true THEN 'Take-Out'
          ELSE CONCAT('Table ', ts.table_id)
        END as table_info
      FROM order_tickets ot
      LEFT JOIN table_sessions ts ON ot.session_id = ts.id
      WHERE ot.status = 'Completed'
    `;

    const params = [];
    let paramCount = 0;

    // Add date filtering if provided
    if (startDate && endDate) {
      paramCount += 2;
      query += ` AND ot.updated_at BETWEEN $${
        paramCount - 1
      } AND $${paramCount}`;
      params.push(startDate, endDate);
    }

    // Add limit
    paramCount += 1;
    query += ` ORDER BY ot.updated_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const ordersResult = await client.query(query, params);
    const orders = ordersResult.rows;

    // For each order, get the items and flavors
    for (const order of orders) {
      // Get items for this order
      const itemsResult = await client.query(
        `SELECT 
          oi.id, 
          oi.menu_item_id, 
          oi.item_name, 
          oi.unit_price, 
          oi.quantity, 
          oi.subtotal, 
          oi.is_unliwings, 
          oi.notes
         FROM order_items oi
         WHERE oi.ticket_id = $1`,
        [order.id]
      );

      const items = itemsResult.rows;

      // Get flavors for each item
      for (const item of items) {
        if (
          item.is_unliwings ||
          (item.menu_item_id && item.item_name.toLowerCase().includes('wing'))
        ) {
          const flavorsResult = await client.query(
            `SELECT wf.id, wf.name, oif.quantity
             FROM order_item_flavors oif
             JOIN wing_flavors wf ON oif.flavor_id = wf.id
             WHERE oif.order_item_id = $1`,
            [item.id]
          );

          item.flavors = flavorsResult.rows.map((row) => ({
            id: row.id,
            name: row.name,
            quantity: row.quantity,
          }));
        } else {
          item.flavors = [];
        }
      }

      // Add the items to the order
      order.items = items;

      // Add table number for easier access
      if (!order.is_takeout && order.table_id) {
        order.tableNumber = order.table_id.toString();
      }
    }

    res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('Error fetching completed orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching completed orders',
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// Get all tickets for a session WITH items and flavors
orderRouter.get('/sessions/:sessionId/tickets', async (req, res) => {
  const client = await pool.connect();

  try {
    const { sessionId } = req.params;

    // Get all tickets for the session
    const ticketsResult = await client.query(
      `SELECT * FROM order_tickets
       WHERE session_id = $1
       ORDER BY created_at DESC`,
      [sessionId]
    );

    const tickets = ticketsResult.rows;

    // For each ticket, get the items and flavors
    for (const ticket of tickets) {
      // Get items for this ticket
      const itemsResult = await client.query(
        `SELECT 
          oi.id, 
          oi.menu_item_id, 
          oi.item_name, 
          oi.unit_price, 
          oi.quantity, 
          oi.subtotal, 
          oi.is_unliwings, 
          oi.notes
         FROM order_items oi
         WHERE oi.ticket_id = $1`,
        [ticket.id]
      );

      const items = itemsResult.rows;

      // Get flavors for each item
      for (const item of items) {
        // Check if it's a wings item that might have flavors
        if (
          item.is_unliwings ||
          (item.menu_item_id && item.item_name.toLowerCase().includes('wing'))
        ) {
          const flavorsResult = await client.query(
            `SELECT wf.id, wf.name, oif.quantity
             FROM order_item_flavors oif
             JOIN wing_flavors wf ON oif.flavor_id = wf.id
             WHERE oif.order_item_id = $1`,
            [item.id]
          );

          item.flavors = flavorsResult.rows.map((row) => ({
            id: row.id,
            name: row.name,
            quantity: row.quantity,
          }));
        } else {
          item.flavors = [];
        }
      }

      // Add the items to the ticket
      ticket.items = items;
    }

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error('Error fetching session tickets with items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// Get ticket details with items and flavors
orderRouter.get('/tickets/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Get ticket details
    const ticketResult = await pool.query(
      'SELECT * FROM order_tickets WHERE id = $1',
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    const ticket = ticketResult.rows[0];

    // Get items for this ticket
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE ticket_id = $1',
      [ticketId]
    );

    const items = itemsResult.rows;

    // Get flavors for each item
    for (const item of items) {
      if (item.is_unliwings || item.is_wing_item) {
        const flavorsResult = await pool.query(
          `SELECT wf.name, oif.quantity
           FROM order_item_flavors oif
           JOIN wing_flavors wf ON oif.flavor_id = wf.id
           WHERE oif.order_item_id = $1`,
          [item.id]
        );

        item.flavors = flavorsResult.rows.map((row) => ({
          name: row.name,
          quantity: row.quantity,
        }));
      }
    }

    ticket.items = items;

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get all take-out orders
orderRouter.get('/takeout', async (req, res) => {
  try {
    // Get take-out orders with optional date range filter
    const { startDate, endDate } = req.query;

    let query = `
      SELECT * FROM order_tickets
      WHERE is_takeout = true
    `;

    const params = [];

    // Add date filtering if provided
    if (startDate && endDate) {
      query += ` AND created_at BETWEEN $1 AND $2`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching take-out orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get a specific take-out order with items and flavors
orderRouter.get('/takeout/:orderId', async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderId } = req.params;

    // Get the order
    const orderResult = await client.query(
      `SELECT * FROM order_tickets 
       WHERE id = $1 AND is_takeout = true`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Take-out order not found',
      });
    }

    const order = orderResult.rows[0];

    // Get items for this order
    const itemsResult = await client.query(
      `SELECT * FROM order_items WHERE ticket_id = $1`,
      [orderId]
    );

    const items = itemsResult.rows;

    // Get flavors for each item
    for (const item of items) {
      if (item.is_unliwings || item.is_wing_item) {
        const flavorsResult = await client.query(
          `SELECT wf.name, oif.quantity
           FROM order_item_flavors oif
           JOIN wing_flavors wf ON oif.flavor_id = wf.id
           WHERE oif.order_item_id = $1`,
          [item.id]
        );

        item.flavors = flavorsResult.rows.map((row) => ({
          name: row.name,
          quantity: row.quantity,
        }));
      }
    }

    order.items = items;

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching take-out order details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// Update ticket status
orderRouter.put('/tickets/:ticketId/status', async (req, res) => {
  const client = await pool.connect();

  try {
    const { ticketId } = req.params;
    const { status, payment_method = 'Cash', processed_by } = req.body;

    if (
      !status ||
      !['Pending', 'Accepted', 'Declined', 'Completed'].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    await client.query('BEGIN');

    // Get the current order to check if it's a take-out order and current status
    const orderResult = await client.query(
      `SELECT * FROM order_tickets WHERE id = $1`,
      [ticketId]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }
    const order = orderResult.rows[0];

    // Update the order status
    const result = await client.query(
      `UPDATE order_tickets
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, ticketId]
    );

    // If this is a dine-in order being declined, subtract the amount from session total
    if (
      status === 'Declined' &&
      order.status !== 'Declined' &&
      order.is_takeout === false &&
      order.session_id
    ) {
      await client.query(
        `UPDATE table_sessions
         SET total_amount = total_amount - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [order.total_amount, order.session_id]
      );
    }

    // If this is a take-out order being marked as "Completed", create a payment record
    if (
      status === 'Completed' &&
      order.status !== 'Completed' &&
      order.is_takeout === true
    ) {
      // Check if payment record already exists to avoid duplicates
      const existingPayment = await client.query(
        `SELECT id FROM payments WHERE take_out_order_id = $1`,
        [ticketId]
      );

      if (existingPayment.rows.length === 0) {
        // Create payment record
        await client.query(
          `INSERT INTO payments (take_out_order_id, amount_paid, payment_method, processed_by)
           VALUES ($1, $2, $3, $4)`,
          [ticketId, order.total_amount, payment_method, processed_by || null]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: `Ticket status updated to ${status}`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// Update take-out order status
// Update take-out order status
orderRouter.put('/takeout/:orderId/status', async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderId } = req.params;
    const { status, payment_method = 'Cash', processed_by } = req.body;

    if (
      !status ||
      !['Pending', 'Accepted', 'Declined', 'Ready', 'Completed'].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    await client.query('BEGIN');

    // Get the current order to check if it's being marked as completed
    const orderResult = await client.query(
      `SELECT * FROM order_tickets 
       WHERE id = $1 AND is_takeout = true`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Take-out order not found',
      });
    }

    const order = orderResult.rows[0];

    // Update the order status
    const result = await client.query(
      `UPDATE order_tickets
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND is_takeout = true
       RETURNING *`,
      [status, orderId]
    );

    // If status is being changed to "Completed", create a payment record
    if (status === 'Completed' && order.status !== 'Completed') {
      // Check if payment record already exists to avoid duplicates
      const existingPayment = await client.query(
        `SELECT id FROM payments WHERE take_out_order_id = $1`,
        [orderId]
      );

      if (existingPayment.rows.length === 0) {
        // Create payment record
        await client.query(
          `INSERT INTO payments (take_out_order_id, amount_paid, payment_method, processed_by)
           VALUES ($1, $2, $3, $4)`,
          [orderId, order.total_amount, payment_method, processed_by || null]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0],
      message: `Take-out order status updated to ${status}`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating take-out order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// Debug endpoint to check all payments
orderRouter.get('/payments/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
             ot.ticket_number,
             ot.is_takeout,
             ts.table_id
      FROM payments p
      LEFT JOIN order_tickets ot ON (p.ticket_id = ot.id OR p.take_out_order_id = ot.id)
      LEFT JOIN table_sessions ts ON p.session_id = ts.id
      ORDER BY p.payment_date DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      message: 'All payments retrieved',
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default orderRouter;
