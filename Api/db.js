import mysql from 'mysql2/promise';
import logger from './utils/logger.js';

const dbConfig = {
  // Ambiente de Pruebas
  // host: '82.197.82.139',
  // user: 'u716541625_terpel_dev2',
  // password: '$2eW[J[1F;>?',
  // database: 'u716541625_terpel_dev2',
  // port: 3306,
  // waitForConnections: true,
  
  host: '82.197.82.139',
  user: 'u716541625_terpel_prod_2',
  password: 'N5p@rBKOM1l@',
  database: 'u716541625_terpel_prod_2',
  port: 3306,
  waitForConnections: true,
  
  // Configuración ALTA CONCURRENCIA: 100 conexiones para 600+ requests simultáneos
  connectionLimit: 75,        // Pool grande para alta concurrencia
  queueLimit: 2000,            // Cola MUY grande para manejar muchos usuarios esperando
  
  // Configuración para alta concurrencia
  connectTimeout: 60000,      // 60 segundos para conexión inicial
  idleTimeout: 300000,        // 5 minutos para mantener conexiones activas más tiempo
  maxIdle: 50,               // Mantener 50 conexiones listas (50% del pool)
  
  // Configuración de keep-alive para múltiples usuarios
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  
  // Configuraciones para rendimiento con múltiples usuarios
  multipleStatements: false,  // Seguridad
  timezone: 'Z'              // UTC
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
    connectionLimit: 75,   // Pool de 75 conexiones (ACTUALIZADO)
    isPoolActive: (pool._allConnections?.length || 0) > 0
  };
  
  // Si el pool no está activo, mostrar capacidad disponible
  if (!status.isPoolActive) {
    status.freeConnections = 75; // Capacidad de 75 disponible (ACTUALIZADO)
  }
  
  return status;
}

// Función para ejecutar consultas directamente con el pool (recomendada para múltiples usuarios)
export async function executeQuery(sql, params = []) {
  let connection;
  try {
    // Usar executeQuery del pool directamente (reutiliza conexiones automáticamente)
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('Error ejecutando consulta:', error.message);
    logger.debug('SQL:', sql);
    logger.debug('Parámetros:', params);
    throw error;
  }
}

// Nueva función para consultas rápidas sin obtener conexión dedicada
export async function executeQueryFast(sql, params = []) {
  try {
    // Ejecuta directamente en el pool sin obtener conexión manual
    // El pool maneja automáticamente la reutilización entre usuarios
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('Error en consulta rápida:', error.message);
    throw error;
  }
}

// Función especial para múltiples usuarios simultáneos
export async function executeQueryForMultipleUsers(sql, params = []) {
  const maxRetries = 2; // Menos reintentos para mejor throughput
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Timeout más largo para queries complejas bajo alta carga
      const queryPromise = pool.execute(sql, params);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout - 45 segundos')), 45000)
      );
      
      const [rows] = await Promise.race([queryPromise, timeoutPromise]);
      return rows;
    } catch (error) {
      lastError = error;
      
      // Solo log warnings en el último intento para no llenar logs
      if (attempt === maxRetries) {
        logger.warn(`Query falló después de ${maxRetries} intentos: ${error.message}`);
      }
      
      if (attempt < maxRetries) {
        // Espera muy corta para alta concurrencia (50ms máximo)
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }
  
  // Si falla completamente, lanzar error específico
  logger.error('Error crítico en consulta para múltiples usuarios:', lastError.message);
  throw new Error(`Database query failed after ${maxRetries} attempts: ${lastError.message}`);
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

// Función mejorada para obtener conexión con reintentos y liberación automática para múltiples usuarios
export async function getConnection(maxRetries = 3) {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      logger.debug(`Intentando obtener conexión para usuario (intento ${retries + 1}/${maxRetries})`);
      
      // Mostrar estado del pool para múltiples usuarios
      if (retries > 0) {
        const status = getPoolStatus();
        logger.debug(`Estado del pool: ${status.freeConnections} libres de ${status.connectionLimit}`);
      }
      
      // Obtener conexión del pool (reutilizable entre usuarios)
      const connection = await pool.getConnection();
      logger.debug('Conexión reutilizable obtenida para usuario');
      
      // Verificar que la conexión esté activa
      await connection.execute('SELECT 1');
      
      // Configurar liberación automática inteligente para múltiples usuarios
      const originalRelease = connection.release.bind(connection);
      let isReleased = false;
      
      connection.release = () => {
        if (!isReleased) {
          isReleased = true;
          originalRelease();
          logger.debug('Conexión liberada y disponible para otros usuarios');
        }
      };
      
      // Auto-liberación más rápida para permitir más usuarios (2 minutos)
      setTimeout(() => {
        if (!isReleased) {
          logger.warn('Auto-liberando conexión para permitir otros usuarios (2 min)');
          connection.release();
        }
      }, 120000); // 2 minutos para liberar rápido y permitir más usuarios
      
      return connection;
    } catch (err) {
      lastError = err;
      retries++;
      logger.error(`Error de conexión para usuario (intento ${retries}/${maxRetries}):`, err.message);
      
      if (retries < maxRetries) {
        // Esperar menos tiempo para no bloquear otros usuarios
        const waitTime = Math.min(500 * Math.pow(2, retries), 3000); // Máximo 3 segundos
        logger.debug(`Esperando ${waitTime}ms antes de reintentar (para no bloquear otros usuarios)...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  logger.error(`Error: No se pudo obtener conexión para usuario después de ${maxRetries} intentos`);
  const status = getPoolStatus();
  logger.debug(`Estado final: ${status.freeConnections} libres de ${status.connectionLimit}`);
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

// Monitoreo automático del pool optimizado para 500 conexiones/hora
const ENABLE_MONITORING = true; // Monitorear para no exceder límites del hosting

if (ENABLE_MONITORING) {
  setInterval(() => {
    const status = getPoolStatus();
    
    // Solo monitorear si el pool está activo
    if (status.isPoolActive) {
      // Alertas críticas para pool de 50
      if (status.freeConnections < 5 && status.acquiringConnections > 10) {
        console.warn('⚠️ CRÍTICO: Pool bajo presión - Conexiones libres:', status.freeConnections);
      }
      
      // Alerta cuando se acerque al límite de 50
      if (status.allConnections > 40) {
        console.warn('⚠️ ALTO USO: Conexiones activas cerca del límite:', status.allConnections);
      }
      
      // Alerta temprana para prevenir saturación
      if (status.allConnections > 35) {
        console.warn('⚡ ADVERTENCIA: Se acerca a capacidad máxima:', status.allConnections, '/ 50');
      }
      
      // Log cada 3 minutos del estado general
      if (Date.now() % 180000 < 10000) { // Aproximadamente cada 3 minutos
        console.log(`📊 Pool Status (50 max): ${status.allConnections} total, ${status.freeConnections} libres, ${status.acquiringConnections} adquiriendo`);
      }
    } else {
      // Log ocasional cuando el pool está inactivo
      if (Date.now() % 300000 < 10000) { // Cada 5 minutos
        console.log(`🟢 Pool INACTIVO: 50 conexiones disponibles para uso`);
      }
    }
  }, 15000); // Cada 15 segundos (menos frecuente para no sobrecargar)
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
