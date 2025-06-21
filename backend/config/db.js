import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create pool configuration based on environment
const createPoolConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && process.env.DATABASE_URL) {
    console.log('🚀 Connecting to NeonDB (Production)...');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  } else {
    console.log('🔧 Connecting to Local PostgreSQL (Development)...');
    return {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    };
  }
};

export const pool = new pg.Pool(createPoolConfig());

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection function
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection test successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
};
