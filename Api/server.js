import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
// import usersRouter from './routes/users.js'; // Comentado temporalmente - archivo no existe
import cargarVisitas from './routes_post/cargar_registros_pdv.js';
import cargarVisitas_Frecuencia from './routes_post/cargar_registros_visita.js';
import mercadeoRouter from './routes/mercadeo.js';
import asesorRouter from './routes/asesor.js';
import publicRouter from './routes/public.js';
import misteryShopperRouter from './routes/mistery.shopper.js';
import otRouter from './routes/ot.js';
import backofficeRouter from './routes/backoffice.js';
import bulkUploadRouter from './routes/bulk-upload.js';
import { getConnection } from './db.js';
import { getCurrentStorageConfig, ensureStorageDirectories } from './config/storage.js';

const app = express();

// Configurar CORS para permitir el frontend remoto
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
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
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

// Middleware para parsear JSON (aplicar globalmente)
app.use(express.json());

// Primero, rutas que reciben archivos (FormData)
app.use('/api', cargarVisitas);
app.use('/api', cargarVisitas_Frecuencia);
app.use('/api/bulk-upload', bulkUploadRouter);

// Luego, rutas que reciben JSON
app.use('/api', authRouter);
// app.use('/api', usersRouter); // Comentado temporalmente - archivo no existe
app.use('/api/mercadeo', mercadeoRouter);
app.use('/api', publicRouter);
app.use('/api/asesor', asesorRouter);
app.use('/api/mistery-shopper', misteryShopperRouter);
app.use('/api/ot', otRouter);
app.use('/api/backoffice', backofficeRouter);

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
  console.log('API escuchando en http://localhost:3001');
});