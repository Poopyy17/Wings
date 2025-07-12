import { pool } from './db.js';

export const createTables = async () => {
  try {
    const queries = `
    -- Create users table for staff authentications
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('cashier', 'chef', 'admin'))
    );

    -- Create tables table to track restaurant tables
    CREATE TABLE IF NOT EXISTS tables (
      id SERIAL PRIMARY KEY,
      table_number VARCHAR(20) NOT NULL UNIQUE,
      status VARCHAR(20) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'For Payment')),
      qr_code_path VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create menu_categories table
    CREATE TABLE IF NOT EXISTS menu_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      display_order INTEGER NOT NULL
    );

    -- Create menu_items table
    CREATE TABLE IF NOT EXISTS menu_items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      category_id INTEGER REFERENCES menu_categories(id),
      is_available BOOLEAN DEFAULT TRUE,
      is_wing_item BOOLEAN DEFAULT FALSE,
      is_unli_eligible BOOLEAN DEFAULT FALSE,
      portion_size INTEGER,
      max_flavor_count INTEGER,
      order_count INTEGER DEFAULT 0,
      image_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create wing_flavors table
    CREATE TABLE IF NOT EXISTS wing_flavors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      is_available BOOLEAN DEFAULT TRUE,
      order_count INTEGER DEFAULT 0
    );
    
    -- Create table_sessions to track entire dining experience
    CREATE TABLE IF NOT EXISTS table_sessions (
      id SERIAL PRIMARY KEY,
      table_id INTEGER REFERENCES tables(id),
      service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('Unliwings', 'Ala-carte')),
      occupancy_count INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Paid')),
      unliwings_base_price DECIMAL(10, 2),
      unliwings_total_charge DECIMAL(10, 2),
      total_amount DECIMAL(10, 2) DEFAULT 0,
      is_paid BOOLEAN DEFAULT FALSE,
      payment_method VARCHAR(50),
      payment_date TIMESTAMP,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create order_tickets table for batches of orders
    CREATE TABLE IF NOT EXISTS order_tickets (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES table_sessions(id),
      is_takeout BOOLEAN DEFAULT FALSE,
      ticket_number VARCHAR(20) NOT NULL UNIQUE,
      status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Declined', 'Ready','Completed')), -- Ready is only for takeout orders
      total_amount DECIMAL(10, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create order_items table for all menu items
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER REFERENCES order_tickets(id),
      menu_item_id INTEGER REFERENCES menu_items(id),
      item_name VARCHAR(100) NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      subtotal DECIMAL(10, 2) NOT NULL,
      is_unliwings BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );    
    
    -- Create order_item_flavors table for flavor selections
    CREATE TABLE IF NOT EXISTS order_item_flavors (
      id SERIAL PRIMARY KEY,
      order_item_id INTEGER REFERENCES order_items(id),
      flavor_id INTEGER REFERENCES wing_flavors(id),
      quantity INTEGER NOT NULL DEFAULT 1
    );
    
    -- Create payments table for tracking payments
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES table_sessions(id),
      ticket_id INTEGER REFERENCES order_tickets(id),
      take_out_order_id INTEGER REFERENCES order_tickets(id),
      amount_paid DECIMAL(10, 2) NOT NULL,
      payment_method VARCHAR(50),
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_by INTEGER REFERENCES users(id),
      CHECK (
          (session_id IS NOT NULL AND ticket_id IS NULL AND take_out_order_id IS NULL) OR
          (session_id IS NULL AND ticket_id IS NOT NULL AND take_out_order_id IS NULL) OR
          (session_id IS NULL AND ticket_id IS NULL AND take_out_order_id IS NOT NULL)
      )
    );
    `;

    await pool.query(queries);
    console.log('All tables created successfully in development database');
    return true;
  } catch (error) {
    console.error('Error in database initialization:', error);
    throw error;
  }
};
