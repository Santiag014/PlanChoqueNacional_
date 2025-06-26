import 'dotenv/config'; // <--- Agrega esta línea al inicio
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import catalogRouter from './routes/catalog.js';
import cargarVisitas from './routes_post/cargar_registros_pdv.js';
import miscRouter from './routes/misc.js';
import misteryRouter from './routes/mistery.js';
import historialRouter from './routes/historial.js';
import { getConnection } from './db.js';
import bcrypt from 'bcrypt';

const app = express();
app.use(express.json());
app.use(cors());

// --- NUEVO: servir archivos estáticos del build de React ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../PlanChoqueTerpel/dist');

app.use('/api', authRouter);
app.use('/api', usersRouter);
app.use('/api', catalogRouter);
app.use('/api', miscRouter);
app.use('/api', cargarVisitas);
app.use('/api', misteryRouter);
app.use('/api', historialRouter);

// Endpoint para probar conexión a la BD
app.get('/api/check-db', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    conn.release(); // <-- Cambia esto
    res.json({ connected: true, message: 'Conexión exitosa a la base de datos' });
  } catch (err) {
    if (conn) conn.release();
    res.status(500).json({ connected: false, message: 'Error de conexión', error: err.message });
  }
});

// Servir la carpeta /public/storage para archivos subidos
app.use('/storage', express.static(path.join(process.cwd(), 'public', 'storage')));

// --- ESTA LÍNEA DEBE IR AL FINAL ---
app.use(express.static(distPath));

// (Opcional) Para SPA: sirve index.html para rutas que no sean de la API
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(3001, () => {
  console.log('API escuchando en http://localhost:3001');
});
