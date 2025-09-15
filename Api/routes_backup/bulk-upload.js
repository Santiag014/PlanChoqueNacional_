import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import bcrypt from 'bcrypt';
import { getConnection } from '../db.js';
import { authenticateToken, requireDirector, logAccess } from '../middleware/auth.js';

const router = express.Router();

// Configuración de multer para archivos temporales
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten archivos Excel (.xlsx, .xls) o CSV.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

// Función para validar email (opcional, mantenida por si acaso)
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 🔒 Endpoint PROTEGIDO para procesar carga masiva de usuarios - SOLO DIRECTORES
router.post('/users', authenticateToken, requireDirector, logAccess, upload.single('file'), async (req, res) => {
  let conn;
  
  // Tiempo de inicio para medir duración total del proceso
  const startTime = Date.now();
  
  console.log('\n====== INICIO CARGA MASIVA DE USUARIOS ======');
  console.log(`📅 Fecha y hora: ${new Date().toLocaleString()}`);
  console.log('📋 Recibiendo solicitud de carga masiva...');
  
  try {
    if (!req.file) {
      console.log('❌ Error: No se proporcionó ningún archivo');
      return res.status(400).json({ 
        success: false, 
        message: 'No se ha proporcionado ningún archivo' 
      });
    }
    
    console.log(`📁 Archivo recibido: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);
    console.log('📄 Procesando archivo Excel...');

    // Leer el archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`📊 Hoja de cálculo encontrada: "${sheetName}"`);
    
    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`🔢 Filas encontradas en el archivo: ${jsonData.length - 1} (excluyendo encabezados)`);
    
    if (jsonData.length < 2) {
      console.log('❌ Error: El archivo no tiene suficientes filas');
      return res.status(400).json({ 
        success: false, 
        message: 'El archivo debe contener al menos una fila de encabezados y una fila de datos' 
      });
    }

    // Obtener encabezados (primera fila)
    const headers = jsonData[0].map(header => header.toString().toLowerCase().trim());
    
    // Mapear columnas requeridas - ajustado a la estructura real de la tabla users
    const requiredColumns = {
      name: ['nombre', 'name', 'usuario', 'nombres'],
      email: ['email', 'correo', 'correo_electronico', 'e-mail'],
      documento: ['documento', 'cedula', 'cc', 'identificacion'],
      rol_id: ['rol_id', 'rol', 'role_id', 'tipo_usuario'],
      IsPromotoria: ['ispromotoria', 'is_promotoria', 'promotoria', 'es_promotoria'],
      agente_id: ['agente_id', 'agente', 'agent_id'],
      ciudad_id: ['ciudad_id', 'ciudad', 'city_id']
      // NOTA: Password NO se incluye porque se genera automáticamente por seguridad
    };

    // Encontrar índices de columnas
    const columnIndices = {};
    for (const [field, possibleNames] of Object.entries(requiredColumns)) {
      const index = headers.findIndex(header => 
        possibleNames.some(name => header.includes(name))
      );
      if (index !== -1) {
        columnIndices[field] = index;
      }
    }

    // Verificar campos obligatorios - solo nombre, email y documento
    const missingFields = [];
    if (columnIndices.name === undefined) missingFields.push('nombre');
    if (columnIndices.email === undefined) missingFields.push('email');
    if (columnIndices.documento === undefined) missingFields.push('documento');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Faltan columnas obligatorias: ${missingFields.join(', ')}`,
        availableHeaders: headers
      });
    }

    // Procesar datos
    const users = [];
    
    console.log('🔌 Estableciendo conexión con la base de datos...');
    
    try {
      // Establecer conexión simple
      conn = await getConnection();
      await conn.execute('SELECT 1');
      console.log('✅ Conexión a la base de datos establecida correctamente');
      
    } catch (connError) {
      console.error('❌ Error al establecer conexión con la base de datos:', connError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al conectar con la base de datos', 
        error: connError.message
      });
    }
    
    // No consultamos tablas de referencia ya que usaremos los IDs directamente
    // Los valores textuales en el Excel se considerarán como IDs

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      if (!row || row.length === 0 || !row[columnIndices.name]) {
        continue;
      }

      const documentoValue = row[columnIndices.documento]?.toString().trim();
      const hashedPassword = await bcrypt.hash(documentoValue, 12); // Hashear el documento

      const user = {
        name: row[columnIndices.name]?.toString().trim(),
        email: row[columnIndices.email]?.toString().trim().toLowerCase(),
        documento: documentoValue,
        password: hashedPassword, // Documento hasheado como contraseña
        rol_id: null,
        IsPromotoria: null,
        agente_id: null,
        ciudad_id: null
      };

      // Procesar rol_id
      if (columnIndices.rol_id !== undefined && row[columnIndices.rol_id]) {
        const rolValue = row[columnIndices.rol_id].toString().trim();
        user.rol_id = !isNaN(rolValue) ? parseInt(rolValue) : 1;
      } else {
        user.rol_id = 1;
      }

      // Procesar IsPromotoria
      if (columnIndices.IsPromotoria !== undefined && row[columnIndices.IsPromotoria]) {
        const promotoriaValue = row[columnIndices.IsPromotoria].toString().trim().toLowerCase();
        user.IsPromotoria = (promotoriaValue === '1' || promotoriaValue === 'si' || promotoriaValue === 'sí') ? 1 : 0;
      } else {
        user.IsPromotoria = 0;
      }

      // Procesar agente_id
      if (columnIndices.agente_id !== undefined && row[columnIndices.agente_id]) {
        const agenteValue = row[columnIndices.agente_id].toString().trim();
        user.agente_id = !isNaN(agenteValue) ? parseInt(agenteValue) : 1;
      } else {
        user.agente_id = 1;
      }

      // Procesar ciudad_id
      if (columnIndices.ciudad_id !== undefined && row[columnIndices.ciudad_id]) {
        const ciudadValue = row[columnIndices.ciudad_id].toString().trim();
        user.ciudad_id = !isNaN(ciudadValue) ? parseInt(ciudadValue) : 1;
      } else {
        user.ciudad_id = 1;
      }

      users.push(user);
    }

    if (users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se encontraron usuarios válidos para procesar'
      });
    }

    // Insertar usuarios en la base de datos - TODOS DE UNA VEZ
    try {
      console.log('🔄 Iniciando transacción en la base de datos...');
      await conn.beginTransaction();
      
      let successCount = 0;
      console.log(`\n----- Insertando ${users.length} usuarios -----\n`);
      
      for (const user of users) {
        try {
          await conn.execute(
            `INSERT IGNORE INTO users (name, email, documento, password, rol_id, IsPromotoria, agente_id, ciudad_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [user.name, user.email, user.documento, user.password, user.rol_id, user.IsPromotoria, user.agente_id, user.ciudad_id]
          );
          successCount++;
          console.log(`✅ Usuario insertado: ${user.name} (${user.email})`);
        } catch (insertError) {
          console.log(`⚠️ Error al insertar ${user.name}: ${insertError.message}`);
        }
      }
      
      await conn.commit();
      console.log(`\n✅ Proceso completado: ${successCount}/${users.length} usuarios insertados\n`);

      res.json({
        success: true,
        message: `Se procesaron ${successCount} usuarios exitosamente. La contraseña de cada usuario es su número de documento.`,
        data: {
          created: successCount,
          total: users.length,
          usuarios_creados: users.map(u => ({
            nombre: u.name,
            email: u.email,
            documento: u.documento,
            password_original: u.documento // Mostramos el documento original (la contraseña sin hashear)
          }))
        }
      });

    } catch (transactionError) {
      console.error('❌ Error durante la transacción:', transactionError.message);
      if (conn) {
        try {
          await conn.rollback();
        } catch (rollbackError) {
          console.error('Error en rollback:', rollbackError);
        }
      }
      throw transactionError;
    }

  } catch (err) {
    console.error('❌ Error general:', err.message);
    
    res.status(500).json({ 
      success: false, 
      message: 'Error al procesar la carga masiva', 
      error: err.message
    });
  } finally {
    if (conn) {
      try {
        conn.release();
      } catch (releaseError) {
        console.error('Error al liberar conexión:', releaseError);
      }
    }
  }
});

export default router;
