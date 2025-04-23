import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected!");
    connection.release();
  } catch (err) {
    console.error("Database connection error:", err);
  }
};

testConnection();

export default pool;