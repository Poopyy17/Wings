import express from 'express';
import { pool } from '../config/db.js';

const AnalyticsRouter = express.Router();

// Get overall analytics summary (total revenue and orders)
AnalyticsRouter.get('/summary', async (req, res) => {
  try {
    const summaryQuery = `
      SELECT 
        (SELECT COALESCE(SUM(amount_paid), 0) FROM payments) as total_revenue,
        (SELECT COUNT(*) FROM payments) as total_payments,
        (SELECT COUNT(*) FROM order_tickets WHERE status IN ('Accepted', 'Ready', 'Completed')) as total_orders
    `;

    const result = await pool.query(summaryQuery);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

// Get revenue trend data
AnalyticsRouter.get('/revenue-trend', async (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    let dateFormat, dateInterval, groupBy;

    switch (period) {
      case 'weekly':
        dateFormat = 'YYYY-MM-DD';
        dateInterval = '7 weeks';
        groupBy = "DATE_TRUNC('week', p.payment_date)";
        break;
      case 'monthly':
        dateFormat = 'YYYY-MM';
        dateInterval = '6 months';
        groupBy = "DATE_TRUNC('month', p.payment_date)";
        break;
      case 'yearly':
        dateFormat = 'YYYY';
        dateInterval = '5 years';
        groupBy = "DATE_TRUNC('year', p.payment_date)";
        break;
      default: // daily
        dateFormat = 'YYYY-MM-DD';
        dateInterval = '7 days';
        groupBy = 'DATE(p.payment_date)';
    }

    const revenueQuery = `
      SELECT 
        TO_CHAR(${groupBy}, '${dateFormat}') as date,
        COALESCE(SUM(p.amount_paid), 0) as revenue
      FROM payments p
      WHERE p.payment_date >= CURRENT_DATE - INTERVAL '${dateInterval}'
      GROUP BY ${groupBy}
      ORDER BY ${groupBy}
    `;

    const result = await pool.query(revenueQuery);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching revenue trend:', error);
    res.status(500).json({ error: 'Failed to fetch revenue trend' });
  }
});

// Get orders trend data
AnalyticsRouter.get('/orders-trend', async (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    let dateFormat, dateInterval, groupBy;

    switch (period) {
      case 'weekly':
        dateFormat = 'YYYY-MM-DD';
        dateInterval = '7 weeks';
        groupBy = "DATE_TRUNC('week', ot.created_at)";
        break;
      case 'monthly':
        dateFormat = 'YYYY-MM';
        dateInterval = '6 months';
        groupBy = "DATE_TRUNC('month', ot.created_at)";
        break;
      case 'yearly':
        dateFormat = 'YYYY';
        dateInterval = '5 years';
        groupBy = "DATE_TRUNC('year', ot.created_at)";
        break;
      default: // daily
        dateFormat = 'YYYY-MM-DD';
        dateInterval = '7 days';
        groupBy = 'DATE(ot.created_at)';
    }

    const ordersQuery = `
      SELECT 
        TO_CHAR(${groupBy}, '${dateFormat}') as date,
        COUNT(ot.id) as orders
      FROM order_tickets ot
      WHERE ot.created_at >= CURRENT_DATE - INTERVAL '${dateInterval}'
        AND ot.status IN ('Accepted', 'Ready', 'Completed')
      GROUP BY ${groupBy}
      ORDER BY ${groupBy}
    `;

    const result = await pool.query(ordersQuery);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders trend:', error);
    res.status(500).json({ error: 'Failed to fetch orders trend' });
  }
});

// Get top selling items
AnalyticsRouter.get('/top-selling', async (req, res) => {
  try {
    const topSellingQuery = `
      SELECT 
        mi.name,
        SUM(oi.quantity) as quantity
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN order_tickets ot ON oi.ticket_id = ot.id
      WHERE ot.status IN ('Accepted', 'Ready', 'Completed')
      GROUP BY mi.id, mi.name
      ORDER BY SUM(oi.quantity) DESC
      LIMIT 5
    `;

    const result = await pool.query(topSellingQuery);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching top selling items:', error);
    res.status(500).json({ error: 'Failed to fetch top selling items' });
  }
});

export default AnalyticsRouter;
