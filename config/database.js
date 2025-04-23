import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'ruther',
  database: 'test',
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