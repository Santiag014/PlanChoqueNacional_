import mysql from 'mysql2/promise';

const dbConfig = {
  host: '82.197.82.76',
  user: 'u315067549_new_energy',
  password: 'LSxq7L03Gz$',
  database: 'u315067549_new_energy',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 50, // Puedes ajustar este valor según tu servidor
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

export async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (err) {
    console.error('❌ Error al conectar a MySQL:', err);
    throw err;
  }
}
