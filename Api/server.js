import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import cargarVisitas from './routes_post/cargar_registros_pdv.js';
import cargarVisitas_Frecuencia from './routes_post/cargar_registros_visita.js';
import cargarImplementaciones from './routes_post/cargar_registros_implementacion.js';
import mercadeoRouter from './routes/mercadeo.js';
import asesorRouter from './routes/asesor.js';
import publicRouter from './routes/public.js';
import misteryShopperRouter from './routes/mistery.shopper.js';
import otRouter from './routes/ot.js';
import backofficeRouter from './routes/backoffice.js';
import bulkUploadRouter from './routes/bulk-upload.js';
import { getConnection } from './db.js';
import { getCurrentStorageConfig, ensureStorageDirectories } from './config/storage.js';
import { generalRateLimit, heavyOperationLimit, dbIntensiveLimit, getRateLimitStats, excelDownloadLimit, excelDownloadLimitByUser } from './middleware/rateLimiter.js';

const app = express();

// Configurar CORS para permitir el frontend remoto y acceso desde dispositivos móviles
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173', // Frontend local
      'http://localhost:3000', // Frontend local alternativo
      'https://plandelamejorenergia.com', // Frontend en producción
      'https://www.plandelamejorenergia.com' // Con www
    ];
    
    // Permitir requests sin origin (móviles, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Solo permitir IPs locales en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      // Permitir cualquier IP local para desarrollo móvil
      // Ejemplos: http://192.168.1.100:5173, http://10.0.0.5:5173, etc.
      const isLocalIP = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):(5173|3000)$/.test(origin);
      
      if (allowedOrigins.indexOf(origin) !== -1 || isLocalIP) {
        callback(null, true);
      } else {
        // En desarrollo, loggear origen rechazado
        console.warn(`❌ CORS: Origen no permitido: ${origin}`);
        callback(new Error('No permitido por CORS'));
      }
    } else {
      // En producción, solo dominios específicos
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // Cache preflight por 24 horas
};

app.use(cors(corsOptions));

// Inicializar configuración de storage
const storageConfig = getCurrentStorageConfig();
//console.log(`🔧 Configuración de storage (${process.env.NODE_ENV || 'development'}):`, storageConfig);

// Asegurar que existan las carpetas de storage
try {
  ensureStorageDirectories(storageConfig.basePath);
} catch (error) {
  console.error('❌ Error inicializando storage:', error);
}

// Middleware para parsear JSON con límites optimizados para alta concurrencia
app.use(express.json({ 
  limit: '10mb',      // Reducido de 50mb para mejor rendimiento con muchos usuarios
  parameterLimit: 1000 // Límite de parámetros para evitar ataques
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 1000
}));

// Aplicar rate limiting para ultra alta concurrencia (600+ usuarios)
app.use('/api', generalRateLimit(500, 900000)); // 500 requests por 15 minutos por IP (aumentado)

// Rate limiting específico para operaciones pesadas (LÍMITE POR USUARIO - RECOMENDADO)
app.use('/api/ot/implementaciones/excel', excelDownloadLimitByUser(30, 3600000)); // 30 descargas Excel por hora POR USUARIO
app.use('/api/bulk-upload', heavyOperationLimit(15, 3600000)); // 15 bulk uploads por hora

// OPTIMIZACIÓN BACKOFFICE: Rate limiting más permisivo pero con cache
app.use('/api/backoffice/usuarios', generalRateLimit(200, 300000)); // 200 requests por 5 min para usuarios
app.use('/api/backoffice/historial-registros-backoffice', generalRateLimit(100, 300000)); // 100 requests por 5 min para registros pesados

// Primero, rutas que reciben archivos (FormData)
app.use('/api', cargarVisitas);
app.use('/api', cargarVisitas_Frecuencia);
app.use('/api', cargarImplementaciones);
app.use('/api/bulk-upload', bulkUploadRouter);

// Luego, rutas que reciben JSON
app.use('/api', authRouter);
app.use('/api/mercadeo', mercadeoRouter);
app.use('/api', publicRouter);
app.use('/api/asesor', asesorRouter);
app.use('/api/mistery-shopper', misteryShopperRouter);
app.use('/api/ot', otRouter);
app.use('/api/backoffice', backofficeRouter);
// app.use('/api/ot', jefeZonaRouter); // MOVIDO A ot.js - Funcionalidad integrada

// --- NUEVO: servir archivos estáticos del build de React ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, 'dist');

// Endpoint para probar conexión a la BD
app.get('/api/check-db', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    conn.release(); 
    res.json({ connected: true, message: 'Conexión exitosa a la base de datos' });
  } catch (err) {
    if (conn) conn.release();
    res.status(500).json({ connected: false, message: 'Error de conexión', error: err.message });
  }
});

// Nuevo endpoint para monitoreo de alta concurrencia
app.get('/api/system/status', async (req, res) => {
  try {
    const { getPoolStatus } = await import('./db.js');
    const poolStatus = getPoolStatus();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      timestamp: new Date().toISOString(),
      database: {
        totalConnections: poolStatus.allConnections,
        freeConnections: poolStatus.freeConnections,
        acquiringConnections: poolStatus.acquiringConnections,
        connectionLimit: 2500,
        utilizationPercentage: Math.round((poolStatus.allConnections / 2500) * 100)
      },
      server: {
        memoryUsage: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
        },
        uptime: Math.round(process.uptime()) + ' segundos',
        nodeVersion: process.version
      },
      recommendations: {
        canHandle400Users: poolStatus.freeConnections > 300 || poolStatus.totalConnections === 0,
        canHandle600Users: poolStatus.freeConnections > 500 || poolStatus.totalConnections === 0,
        currentCapacity: poolStatus.totalConnections === 0 ? 
          '2500 usuarios simultáneos disponibles (pool inactivo)' : 
          Math.floor(poolStatus.freeConnections / 3) + ' usuarios simultáneos estimados',
        maxTheoreticalUsers: Math.floor(2500 / 3) + ' usuarios máximos teóricos',
        status: poolStatus.totalConnections === 0 ? 'INACTIVO/DISPONIBLE' :
               poolStatus.freeConnections > 500 ? 'ÓPTIMO' : 
               poolStatus.freeConnections > 300 ? 'NORMAL' : 
               poolStatus.freeConnections > 100 ? 'BAJO' : 'SATURADO',
        poolInitialized: poolStatus.totalConnections > 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error obteniendo estado del sistema',
      message: error.message 
    });
  }
});

// Nuevo endpoint para monitoreo específico de backoffice
app.get('/api/backoffice/performance', async (req, res) => {
  try {
    const { getPoolStatus } = await import('./db.js');
    const poolStatus = getPoolStatus();
    const memoryUsage = process.memoryUsage();
    
    // Medir tiempo de respuesta de la BD
    const startTime = Date.now();
    let conn;
    try {
      conn = await getConnection();
      const dbResponseTime = Date.now() - startTime;
      conn.release();
      
      res.json({
        timestamp: new Date().toISOString(),
        backofficeOptimization: {
          dbResponseTime: dbResponseTime + 'ms',
          poolUtilization: Math.round((poolStatus.allConnections / 2500) * 100) + '%',
          availableConnections: poolStatus.freeConnections,
          recommendedAction: dbResponseTime > 1000 ? 'OPTIMIZAR_CONSULTAS' : 
                            poolStatus.freeConnections < 100 ? 'AUMENTAR_POOL' : 'NORMAL',
          suggestions: {
            enablePagination: dbResponseTime > 500,
            useClientFiltering: poolStatus.freeConnections > 200,
            needQueryOptimization: dbResponseTime > 1000,
            needIndexing: dbResponseTime > 2000
          }
        },
        performance: {
          memoryPressure: memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8,
          serverLoad: process.cpuUsage(),
          criticalMemory: memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9
        }
      });
    } catch (dbError) {
      if (conn) conn.release();
      throw dbError;
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Error en diagnóstico de backoffice',
      message: error.message 
    });
  }
});

// Endpoint para estadísticas de rate limiting
app.get('/api/system/rate-limits', (req, res) => {
  try {
    const stats = getRateLimitStats();
    res.json({
      ...stats,
      message: 'Estadísticas de rate limiting para 400 usuarios simultáneos'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas de rate limiting',
      message: error.message 
    });
  }
});

// Endpoint para verificar la configuración de storage
app.get('/api/storage-info', (req, res) => {
  const config = getCurrentStorageConfig();
  res.json({
    environment: process.env.NODE_ENV || 'development',
    storageBasePath: config.basePath,
    publicUrl: config.publicUrl,
    webUrl: config.webUrl,
    message: 'Configuración de storage actualizada'
  });
});

// Servir la carpeta de storage para archivos subidos
app.use('/uploads', express.static(storageConfig.basePath));
app.use('/storage', express.static(storageConfig.basePath));

// --- ESTA LÍNEA DEBE IR AL FINAL ---
app.use(express.static(distPath));

// (Opcional) Para SPA: sirve index.html para rutas que no sean de la API
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(3001, () => {
  console.log('🚀 API escuchando en http://localhost:3001');
});