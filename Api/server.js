import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import cargarVisitas from './routes_post/cargar_registros_pdv.js';
import cargarVisitas_Frecuencia from './routes_post/cargar_registros_visita.js';
import mercadeoRouter from './routes/mercadeo.js';
import asesorRouter from './routes/asesor.js';
import publicRouter from './routes/public.js';
import misteryShopperRouter from './routes/mistery.shopper.js';
import otRouter from './routes/ot.js';
import bulkUploadRouter from './routes/bulk-upload.js';
import { getConnection } from './db.js';

const app = express();

app.use(cors());

// Middleware para parsear JSON (aplicar globalmente)
app.use(express.json());

// Primero, rutas que reciben archivos (FormData)
app.use('/api', cargarVisitas);
app.use('/api', cargarVisitas_Frecuencia);
app.use('/api/bulk-upload', bulkUploadRouter);

// Luego, rutas que reciben JSON
app.use('/api', authRouter);
app.use('/api', usersRouter);
app.use('/api/mercadeo', mercadeoRouter);
app.use('/api', publicRouter);
app.use('/api/asesor', asesorRouter);
app.use('/api/mistery-shopper', misteryShopperRouter);
app.use('/api/ot', otRouter);

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
  res.json({
    storageBasePath: '/home/u123456789/sub/public_html/storage',
    publicUrl: 'https://api.plandelamejorenergia.com/storage',
    message: 'Configuración de storage para VPS Hostinger'
  });
});

// Servir la carpeta de storage para archivos subidos (VPS Hostinger)
app.use('/storage', express.static('/home/u123456789/sub/public_html/storage'));

// --- ESTA LÍNEA DEBE IR AL FINAL ---
app.use(express.static(distPath));

// (Opcional) Para SPA: sirve index.html para rutas que no sean de la API
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(3001, () => {
  console.log('API escuchando en http://localhost:3001');
});