import mysql from 'mysql2/promise';
import logger from './utils/logger.js';

const dbConfig = {
  host: '82.197.82.139',
  user: 'u716541625_terpel_prod_2',
  password: 'N5p@rBKOM1l@',
  database: 'u716541625_terpel_prod_2',
  port: 3306,
  waitForConnections: true,
  
  // Configuración optimizada para 2000+ conexiones diarias
  connectionLimit: 2500,       // Pool muy grande para 600+ usuarios simultáneos
  queueLimit: 0,              // Sin límite en cola (permite procesar todas las solicitudes)
  acquireTimeout: 20000,      // 20 segundos para adquirir conexión del pool (más rápido)
  
  // Configuración de timeouts optimizada para ultra alta concurrencia
  connectTimeout: 15000,      // 15 segundos para conexión inicial (muy rápido)
  idleTimeout: 120000,        // 2 minutos para conexiones inactivas (liberar muy rápido)
  maxIdle: 400,              // Muchas más conexiones inactivas para reutilización instantánea
  
  // Configuración de keep-alive mejorada
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  
  // Configuraciones adicionales para alta concurrencia
  multipleStatements: false,  // Seguridad adicional
  timezone: 'Z',             // UTC para consistencia
  
  // Configuraciones adicionales para rendimiento
  reconnect: true,           // Reconectar automáticamente
  reconnectDelay: 1000,      // 1 segundo de delay para reconexión
  maxReconnects: 10          // Máximo 10 intentos de reconexión
};

// Crea el pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para monitorear el estado del pool
export function getPoolStatus() {
  const status = {
    totalConnections: pool._allConnections?.length || 0,
    allConnections: pool._allConnections?.length || 0,
    freeConnections: pool._freeConnections?.length || 0,
    acquiringConnections: pool._acquiringConnections?.length || 0,
    connectionLimit: 2500,
    isPoolActive: (pool._allConnections?.length || 0) > 0
  };
  
  // Si el pool no está activo, mostrar capacidad completa disponible
  if (!status.isPoolActive) {
    status.freeConnections = 2500; // Capacidad completa disponible
  }
  
  return status;
}

// Función para ejecutar consultas directamente con el pool (recomendada)
export async function executeQuery(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('Error ejecutando consulta:', error.message);
    logger.debug('SQL:', sql);
    logger.debug('Parámetros:', params);
    throw error;
  }
}

// Función para transacciones
export async function executeTransaction(queries) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { sql, params } of queries) {
      const [result] = await connection.execute(sql, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    logger.error('Error en transacción:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// Función mejorada para obtener conexión con reintentos y timeout automático
export async function getConnection(maxRetries = 3) {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      logger.debug(`Intentando obtener conexión a MySQL (intento ${retries + 1}/${maxRetries})`);
      
      // Mostrar estado del pool antes de intentar conexión
      if (retries > 0) {
        logger.debug('Estado del pool:', getPoolStatus());
      }
      
      const connection = await pool.getConnection();
      logger.debug('Conexión a MySQL establecida exitosamente');
      
      // Verificar que la conexión esté activa con una consulta simple
      await connection.execute('SELECT 1');
      
      // Configurar timeout automático para liberar la conexión si no se libera manualmente
      const originalRelease = connection.release.bind(connection);
      let isReleased = false;
      
      connection.release = () => {
        if (!isReleased) {
          isReleased = true;
          originalRelease();
          logger.debug('Conexión liberada correctamente');
        }
      };
      
      // Auto-release después de 2 minutos para ultra alta concurrencia (muy rápido)
      setTimeout(() => {
        if (!isReleased) {
          logger.warn('Auto-liberando conexión después de 2 minutos para ultra alta concurrencia');
          connection.release();
        }
      }, 120000); // 2 minutos (reducido para liberar conexiones súper rápido)
      
      return connection;
    } catch (err) {
      lastError = err;
      retries++;
      logger.error(`Error al conectar a MySQL (intento ${retries}/${maxRetries}):`, err.message);
      
      if (retries < maxRetries) {
        // Esperar antes de reintentar (backoff exponencial)
        const waitTime = Math.min(1000 * Math.pow(2, retries), 10000);
        logger.debug(`Esperando ${waitTime}ms antes de reintentar conexión...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  logger.error(`Error fatal: No se pudo conectar a MySQL después de ${maxRetries} intentos`);
  logger.debug('Estado final del pool:', getPoolStatus());
  throw lastError;
}

// Función para cerrar el pool de conexiones de forma segura
export async function closePool() {
  try {
    logger.info('Cerrando pool de conexiones MySQL...');
    await pool.end();
    logger.info('Pool de conexiones cerrado correctamente');
  } catch (error) {
    logger.error('Error cerrando pool:', error.message);
  }
}

// Monitoreo automático del pool optimizado para 2000+ conexiones diarias
const ENABLE_MONITORING = true; // Siempre habilitado para monitorear 600+ usuarios

if (ENABLE_MONITORING) {
  setInterval(() => {
    const status = getPoolStatus();
    
    // Solo monitorear si el pool está activo
    if (status.isPoolActive) {
      // Alertas críticas para ultra alta concurrencia
      if (status.freeConnections < 300 && status.acquiringConnections > 100) {
        console.warn('⚠️ CRÍTICO: Pool bajo presión extrema - Conexiones libres:', status.freeConnections);
      }
      
      // Alerta cuando se acerque al límite de 2500
      if (status.allConnections > 2000) {
        console.warn('⚠️ ULTRA ALTO USO: Conexiones activas cerca del límite máximo:', status.allConnections);
      }
      
      // Alerta temprana para prevenir saturación
      if (status.allConnections > 1800) {
        console.warn('⚡ ALTO USO: Se acerca a capacidad máxima:', status.allConnections, '/ 2500');
      }
      
      // Log cada 3 minutos del estado general (más frecuente)
      if (Date.now() % 180000 < 10000) { // Aproximadamente cada 3 minutos
        console.log(`📊 Pool Status (2500 max): ${status.allConnections} total, ${status.freeConnections} libres, ${status.acquiringConnections} adquiriendo`);
      }
    } else {
      // Log ocasional cuando el pool está inactivo
      if (Date.now() % 300000 < 10000) { // Cada 5 minutos
        console.log(`🟢 Pool INACTIVO: 2500 conexiones disponibles para uso`);
      }
    }
  }, 10000); // Cada 10 segundos (muy frecuente para ultra alta concurrencia)
}

// Manejo de eventos del pool
pool.on('connection', (connection) => {
  logger.debug('Nueva conexión establecida como id ' + connection.threadId);
});

pool.on('error', (err) => {
  logger.error('Error en el pool de conexiones:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    logger.warn('Conexión perdida, reintentando...');
  }
});

// Limpieza al cerrar la aplicación
process.on('SIGINT', async () => {
  logger.info('Cerrando aplicación...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Terminando aplicación...');
  await closePool();
  process.exit(0);
});
