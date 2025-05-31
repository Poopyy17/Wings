import { pool } from './db.js';
import bcrypt from 'bcrypt';

export const seedData = async () => {
  try {
    // Check if data already exists
    const tableCheck = await pool.query('SELECT COUNT(*) FROM tables');
    const userCheck = await pool.query('SELECT COUNT(*) FROM users');
    const menuItemCheck = await pool.query('SELECT COUNT(*) FROM menu_items');

    // If we already have tables, users, and menu items, skip seeding
    if (
      tableCheck.rows[0].count > 0 &&
      userCheck.rows[0].count > 0 &&
      menuItemCheck.rows[0].count > 0
    ) {
      console.log('Database already seeded. Skipping seed operation.');
      return true;
    }

    console.log('Seeding database with initial data...');

    // Insert users (admin, cashier, chef)
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('123456', saltRounds);
    const cashierPassword = await bcrypt.hash('234567', saltRounds);
    const chefPassword = await bcrypt.hash('345678', saltRounds);

    const userInsertQueries = `
      -- Insert users
      INSERT INTO users (username, password, role) 
      VALUES 
        ('admin', '${adminPassword}', 'admin'),
        ('cashier', '${cashierPassword}', 'cashier'),
        ('chef', '${chefPassword}', 'chef')
      ON CONFLICT (username) DO NOTHING;
    `;

    await pool.query(userInsertQueries);
    console.log('Users seeded successfully');

    // Insert menu categories
    const categoryInsertQueries = `
      -- Insert menu categories
      INSERT INTO menu_categories (name, display_order) 
      VALUES 
        ('Unliwings', 1),
        ('Ala Carte Wings', 2),
        ('Rice Meals', 3),
        ('Nachos', 4),
        ('Fries', 5),
        ('Snacks', 6),
        ('Refreshers', 7),
        ('Extras', 8)
      ON CONFLICT (name) DO NOTHING;
    `;

    await pool.query(categoryInsertQueries);
    console.log('Menu categories seeded successfully'); // Insert wing flavors
    const flavorInsertQueries = `
      -- Insert wing flavors
      INSERT INTO wing_flavors (name, is_available, order_count) 
      VALUES 
        ('Soy Garlic', true, 0),
        ('Honey Garlic', true, 0),
        ('Spicy Buffalo', true, 0),
        ('Honey Butter', true, 0),
        ('Honey Mustard', true, 0),
        ('Garlic Parmesan', true, 0),
        ('Wings Express Signature', true, 0),
        ('Salted Egg', true, 0),
        ('Spicy Teriyaki', true, 0),
        ('Teriyaki', true, 0),
        ('Lemon Glazed', true, 0),
        ('Sweet Chili', true, 0),
        ('Garlic Butter', true, 0),
        ('Spicy BBQ', true, 0),
        ('Cheesy Cheese', true, 0),
        ('Chili Cheese', true, 0),
        ('Salt and Pepper', true, 0)
      ON CONFLICT (name) DO NOTHING;
    `;

    await pool.query(flavorInsertQueries);
    console.log('Wing flavors seeded successfully'); // Insert menu items - Unli Wings
    const unliWingsInsertQuery = `
      -- Insert Unli Wings item
      INSERT INTO menu_items (name, description, price, category_id, is_available, is_wing_item, is_unli_eligible, order_count) 
      SELECT 'Unliwings', 'Unlimited wings with 17 different flavors', 289.00, 
        (SELECT id FROM menu_categories WHERE name = 'Unliwings'), true, true, true, 0
      WHERE NOT EXISTS (
        SELECT 1 FROM menu_items WHERE name = 'Unliwings'
      );
    `;

    await pool.query(unliWingsInsertQuery);
    console.log('Unli Wings item seeded successfully'); // Insert menu items - Ala Carte Wings
    const alaCarteWingsInsertQuery = `
      -- Insert Ala Carte Wings items
      INSERT INTO menu_items (name, description, price, category_id, is_available, is_wing_item, portion_size, max_flavor_count, order_count) 
      SELECT '3pcs Wings', '3 pieces of wings (1 flavor)', 109.00, 
        (SELECT id FROM menu_categories WHERE name = 'Ala Carte Wings'), true, true, 3, 1, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = '3pcs Wings');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, is_wing_item, portion_size, max_flavor_count, order_count) 
      SELECT '6pcs Wings', '6 pieces of wings (2 flavors)', 169.00, 
        (SELECT id FROM menu_categories WHERE name = 'Ala Carte Wings'), true, true, 6, 2, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = '6pcs Wings');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, is_wing_item, portion_size, max_flavor_count, order_count) 
      SELECT '12pcs Wings', '12 pieces of wings (3 flavors)', 299.00, 
        (SELECT id FROM menu_categories WHERE name = 'Ala Carte Wings'), true, true, 12, 3, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = '12pcs Wings');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, is_wing_item, portion_size, max_flavor_count, order_count) 
      SELECT '24pcs Wings', '24 pieces of wings (6 flavors)', 559.00, 
        (SELECT id FROM menu_categories WHERE name = 'Ala Carte Wings'), true, true, 24, 6, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = '24pcs Wings');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, is_wing_item, portion_size, max_flavor_count, order_count) 
      SELECT '36pcs Wings', '36 pieces of wings (9 flavors)', 849.00, 
        (SELECT id FROM menu_categories WHERE name = 'Ala Carte Wings'), true, true, 36, 9, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = '36pcs Wings');
    `;

    await pool.query(alaCarteWingsInsertQuery);
    console.log('Ala Carte Wings items seeded successfully'); // Insert menu items - Rice Meals
    const riceMealsInsertQuery = `
      -- Insert Rice Meals items
      INSERT INTO menu_items (name, description, price, category_id, is_available, is_wing_item, portion_size, max_flavor_count, order_count) 
      SELECT '3pcs Wings with Rice', '3 pieces of wings with 1 cup of rice', 119.00, 
        (SELECT id FROM menu_categories WHERE name = 'Rice Meals'), true, true, 3, 1, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = '3pcs Wings with Rice');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, is_wing_item, portion_size, max_flavor_count, order_count) 
      SELECT '6pcs Wings with 1 Rice', '6 pieces of wings with 1 cup of rice', 179.00, 
        (SELECT id FROM menu_categories WHERE name = 'Rice Meals'), true, true, 6, 2, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = '6pcs Wings with 1 Rice');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, is_wing_item, portion_size, max_flavor_count, order_count) 
      SELECT '6pcs Wings with 2 Rice', '6 pieces of wings with 2 cups of rice', 189.00, 
        (SELECT id FROM menu_categories WHERE name = 'Rice Meals'), true, true, 6, 2, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = '6pcs Wings with 2 Rice');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, is_wing_item, portion_size, max_flavor_count, order_count) 
      SELECT '12pcs Wings with 2 Rice', '12 pieces of wings with 2 cups of rice', 319.00, 
        (SELECT id FROM menu_categories WHERE name = 'Rice Meals'), true, true, 12, 3, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = '12pcs Wings with 2 Rice');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, is_wing_item, portion_size, max_flavor_count, order_count) 
      SELECT '24pcs Wings with 2 Rice', '24 pieces of wings with 2 cups of rice', 619.00, 
        (SELECT id FROM menu_categories WHERE name = 'Rice Meals'), true, true, 24, 6, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = '24pcs Wings with 2 Rice');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Nuggets with Rice', 'Chicken nuggets with rice', 119.00, 
        (SELECT id FROM menu_categories WHERE name = 'Rice Meals'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Nuggets with Rice');
    `;

    await pool.query(riceMealsInsertQuery);
    console.log('Rice Meals items seeded successfully'); // Insert menu items - Nachos
    const nachosInsertQuery = `
      -- Insert Nachos items
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Cheesy Nachos', 'Nachos with cheese sauce', 89.00, 
        (SELECT id FROM menu_categories WHERE name = 'Nachos'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Cheesy Nachos');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Overload Nachos', 'Nachos with special toppings', 99.00, 
        (SELECT id FROM menu_categories WHERE name = 'Nachos'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Overload Nachos');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Overload Nachos Fries', 'Fries with nachos toppings', 109.00, 
        (SELECT id FROM menu_categories WHERE name = 'Nachos'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Overload Nachos Fries');
    `;

    await pool.query(nachosInsertQuery);
    console.log('Nachos items seeded successfully'); // Insert menu items - Fries
    const friesInsertQuery = `
      -- Insert Fries items
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Cheese Fries', 'Fries with cheese flavor', 59.00, 
        (SELECT id FROM menu_categories WHERE name = 'Fries'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Cheese Fries');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Sour Cream Fries', 'Fries with sour cream flavor', 59.00, 
        (SELECT id FROM menu_categories WHERE name = 'Fries'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Sour Cream Fries');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'BBQ Fries', 'Fries with BBQ flavor', 59.00, 
        (SELECT id FROM menu_categories WHERE name = 'Fries'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'BBQ Fries');
    `;

    await pool.query(friesInsertQuery);
    console.log('Fries items seeded successfully'); // Insert menu items - Snacks
    const snacksInsertQuery = `
      -- Insert Snacks items
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Chicken Nuggets', 'Chicken nuggets', 99.00, 
        (SELECT id FROM menu_categories WHERE name = 'Snacks'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Chicken Nuggets');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Kikiam', 'Filipino-style kikiam', 69.00, 
        (SELECT id FROM menu_categories WHERE name = 'Snacks'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Kikiam');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Lumpiang Shanghai', 'Filipino-style spring rolls', 99.00, 
        (SELECT id FROM menu_categories WHERE name = 'Snacks'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Lumpiang Shanghai');
    `;

    await pool.query(snacksInsertQuery);
    console.log('Snacks items seeded successfully');

    // Insert menu items - Refreshers
    const refreshersItems = [
      {
        name: 'House Blend Iced Tea Medium',
        desc: 'Medium size house blend iced tea',
        price: 49.0,
      },
      {
        name: 'House Blend Iced Tea Large',
        desc: 'Large size house blend iced tea',
        price: 59.0,
      },
      {
        name: 'House Blend Iced Tea 1 Liter',
        desc: '1 liter house blend iced tea',
        price: 79.0,
      },
      {
        name: 'Strawberry Medium',
        desc: 'Medium size strawberry drink',
        price: 49.0,
      },
      {
        name: 'Strawberry Large',
        desc: 'Large size strawberry drink',
        price: 59.0,
      },
      {
        name: 'Strawberry 1 Liter',
        desc: '1 liter strawberry drink',
        price: 79.0,
      },
      { name: 'Lychee Medium', desc: 'Medium size lychee drink', price: 49.0 },
      { name: 'Lychee Large', desc: 'Large size lychee drink', price: 59.0 },
      { name: 'Lychee 1 Liter', desc: '1 liter lychee drink', price: 79.0 },
      {
        name: 'Green Apple Medium',
        desc: 'Medium size green apple drink',
        price: 49.0,
      },
      {
        name: 'Green Apple Large',
        desc: 'Large size green apple drink',
        price: 59.0,
      },
      {
        name: 'Green Apple 1 Liter',
        desc: '1 liter green apple drink',
        price: 79.0,
      },
      {
        name: 'Blueberry Medium',
        desc: 'Medium size blueberry drink',
        price: 49.0,
      },
      {
        name: 'Blueberry Large',
        desc: 'Large size blueberry drink',
        price: 59.0,
      },
      {
        name: 'Blueberry 1 Liter',
        desc: '1 liter blueberry drink',
        price: 79.0,
      },
      { name: 'Lemon Medium', desc: 'Medium size lemon drink', price: 49.0 },
      { name: 'Lemon Large', desc: 'Large size lemon drink', price: 59.0 },
      { name: 'Lemon 1 Liter', desc: '1 liter lemon drink', price: 79.0 },
    ];

    // Insert refreshers one by one to avoid long query
    const refresherCategoryId = await pool.query(
      "SELECT id FROM menu_categories WHERE name = 'Refreshers'"
    );
    const catId = refresherCategoryId.rows[0].id;
    for (const item of refreshersItems) {
      await pool.query(
        `INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
         SELECT $1::varchar, $2::text, $3::numeric, $4::integer, true, 0
         WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = $1::varchar)`,
        [item.name, item.desc, item.price, catId]
      );
    }

    console.log('Refreshers items seeded successfully'); // Insert menu items - Extras
    const extrasInsertQuery = `
      -- Insert Extras items
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Rice', 'Plain steamed rice', 15.00, 
        (SELECT id FROM menu_categories WHERE name = 'Extras'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Rice');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Garlic Mayo Dip', 'Garlic mayo dipping sauce', 25.00, 
        (SELECT id FROM menu_categories WHERE name = 'Extras'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Garlic Mayo Dip');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Cheese Dip', 'Cheese dipping sauce', 25.00, 
        (SELECT id FROM menu_categories WHERE name = 'Extras'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Cheese Dip');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Plain Mayo', 'Plain mayo dipping sauce', 15.00, 
        (SELECT id FROM menu_categories WHERE name = 'Extras'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Plain Mayo');
      
      INSERT INTO menu_items (name, description, price, category_id, is_available, order_count) 
      SELECT 'Ketchup', 'Tomato ketchup', 15.00, 
        (SELECT id FROM menu_categories WHERE name = 'Extras'), true, 0
      WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Ketchup');
    `;

    await pool.query(extrasInsertQuery);
    console.log('Extras items seeded successfully');

    // Insert tables
    const tablesInsertQuery = `
      -- Insert tables (6 tables)
      INSERT INTO tables (table_number, status, qr_code_path) 
      VALUES 
        ('1', 'Available', '/uploads/qrcodes/table_1_qrcode.png'),
        ('2', 'Available', '/uploads/qrcodes/table_2_qrcode.png'),
        ('3', 'Available', '/uploads/qrcodes/table_3_qrcode.png'),
        ('4', 'Available', '/uploads/qrcodes/table_4_qrcode.png'),
        ('5', 'Available', '/uploads/qrcodes/table_5_qrcode.png'),
        ('6', 'Available', '/uploads/qrcodes/table_6_qrcode.png')
      ON CONFLICT (table_number) DO NOTHING;
    `;

    await pool.query(tablesInsertQuery);
    console.log('Tables seeded successfully');

    console.log('Database seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error in database seed operation:', error);
    throw error;
  }
};
