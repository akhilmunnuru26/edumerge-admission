const { Pool } = require('pg');
require('dotenv').config();

// Un comment the following lines to use in local development

// const pool = new Pool({
//     host: process.env.DB_HOST || 'localhost',
//     port: process.env.DB_PORT || 5432,
//     database: process.env.DB_NAME || 'edumerge_db',
//     user: process.env.DB_USER || 'postgres',
//     password: process.env.DB_PASSWORD,
//     max: 20, // Maximum number of clients in the pool
//     idleTimeoutMillis: 30000,
//     connectionTimeoutMillis: 2000,
// });

// Test database connection


// Comment for local development and un comment for Render/external connections

const pool = new Pool({
  
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render/external connections
  }
});

pool.on('connect', () => {
    console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});

module.exports = pool;
