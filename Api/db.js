import mysql from 'mysql2/promise';

const dbConfig = {
  host: '82.197.82.76',
  user: 'u315067549_terpel_dev',
  password: '?G2yD|f@Q[Bt',
  database: 'u315067549_terpel_dev',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
  // Configuración de timeouts corregida para MySQL2
  connectTimeout: 60000, // 60 segundos para conexión inicial
  idleTimeout: 300000,   // 5 minutos para conexiones inactivas
  maxIdle: 10,           // máximo de conexiones inactivas
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Crea el pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función mejorada para obtener conexión con reintentos
export async function getConnection(maxRetries = 3) {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      console.log(`🔄 Intentando obtener conexión a MySQL (intento ${retries + 1}/${maxRetries})`);
      const connection = await pool.getConnection();
      console.log('✅ Conexión a MySQL establecida exitosamente');
      
      // Verificar que la conexión esté activa con una consulta simple
      await connection.execute('SELECT 1');
      
      return connection;
    } catch (err) {
      lastError = err;
      retries++;
      console.error(`❌ Error al conectar a MySQL (intento ${retries}/${maxRetries}):`, err.message);
      
      if (retries < maxRetries) {
        // Esperar antes de reintentar (backoff exponencial)
        const waitTime = Math.min(1000 * Math.pow(2, retries), 10000);
        console.log(`⏱️ Esperando ${waitTime}ms antes de reintentar conexión...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error(`❌ Error fatal: No se pudo conectar a MySQL después de ${maxRetries} intentos`);
  throw lastError;
}
