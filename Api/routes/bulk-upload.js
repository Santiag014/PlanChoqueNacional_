import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import bcrypt from 'bcrypt';
import { getConnection } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

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

// Función para validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para generar contraseña aleatoria
const generateRandomPassword = (length = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Endpoint para procesar carga masiva de usuarios
router.post('/users', authenticateToken, upload.single('file'), async (req, res) => {
  let conn;
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se ha proporcionado ningún archivo' 
      });
    }

    // Leer el archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'El archivo debe contener al menos una fila de encabezados y una fila de datos' 
      });
    }

    // Obtener encabezados (primera fila)
    const headers = jsonData[0].map(header => header.toString().toLowerCase().trim());
    
    // Mapear columnas requeridas
    const requiredColumns = {
      name: ['nombre', 'name', 'usuario', 'nombres'],
      email: ['email', 'correo', 'correo_electronico', 'e-mail'],
      documento: ['documento', 'cedula', 'cc', 'identificacion'],
      apellido: ['apellido', 'apellidos', 'lastname'],
      rol_id: ['rol_id', 'rol', 'role_id', 'tipo_usuario'],
      zona_id: ['zona_id', 'zona', 'zone_id'],
      regional_id: ['regional_id', 'regional', 'region_id'],
      agente_id: ['agente_id', 'agente', 'agent_id']
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

    // Verificar campos obligatorios
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
    const errors = [];
    const generatedPasswords = [];

    conn = await getConnection();

    // Obtener datos de referencia para validación
    const [roles] = await conn.execute('SELECT id, descripcion FROM rol');
    const [zonas] = await conn.execute('SELECT id, descripcion FROM zona');
    const [regionales] = await conn.execute('SELECT id, descripcion FROM regional');
    const [agentes] = await conn.execute('SELECT id, descripcion FROM agente');

    const roleMap = new Map(roles.map(r => [r.descripcion.toLowerCase(), r.id]));
    const zonaMap = new Map(zonas.map(z => [z.descripcion.toLowerCase(), z.id]));
    const regionalMap = new Map(regionales.map(r => [r.descripcion.toLowerCase(), r.id]));
    const agenteMap = new Map(agentes.map(a => [a.descripcion.toLowerCase(), a.id]));

    for (let i = 1; i < jsonData.length; i++) { // Empezar desde 1 para saltar encabezados
      const row = jsonData[i];
      
      if (!row || row.length === 0 || !row[columnIndices.name]) {
        continue; // Saltar filas vacías
      }

      const user = {
        name: row[columnIndices.name]?.toString().trim(),
        email: row[columnIndices.email]?.toString().trim().toLowerCase(),
        documento: row[columnIndices.documento]?.toString().trim(),
        apellido: row[columnIndices.apellido]?.toString().trim() || '',
        rol_id: null,
        zona_id: null,
        regional_id: null,
        agente_id: null
      };

      // Validar email
      if (!isValidEmail(user.email)) {
        errors.push(`Fila ${i + 1}: Email inválido (${user.email})`);
        continue;
      }

      // Procesar rol_id
      if (columnIndices.rol_id !== undefined && row[columnIndices.rol_id]) {
        const rolValue = row[columnIndices.rol_id].toString().trim();
        if (!isNaN(rolValue)) {
          user.rol_id = parseInt(rolValue);
        } else {
          user.rol_id = roleMap.get(rolValue.toLowerCase()) || 1; // Default a rol 1
        }
      } else {
        user.rol_id = 1; // Default
      }

      // Procesar zona_id
      if (columnIndices.zona_id !== undefined && row[columnIndices.zona_id]) {
        const zonaValue = row[columnIndices.zona_id].toString().trim();
        if (!isNaN(zonaValue)) {
          user.zona_id = parseInt(zonaValue);
        } else {
          user.zona_id = zonaMap.get(zonaValue.toLowerCase()) || 1; // Default a zona 1
        }
      } else {
        user.zona_id = 1; // Default
      }

      // Procesar regional_id
      if (columnIndices.regional_id !== undefined && row[columnIndices.regional_id]) {
        const regionalValue = row[columnIndices.regional_id].toString().trim();
        if (!isNaN(regionalValue)) {
          user.regional_id = parseInt(regionalValue);
        } else {
          user.regional_id = regionalMap.get(regionalValue.toLowerCase()) || 1; // Default a regional 1
        }
      } else {
        user.regional_id = 1; // Default
      }

      // Procesar agente_id
      if (columnIndices.agente_id !== undefined && row[columnIndices.agente_id]) {
        const agenteValue = row[columnIndices.agente_id].toString().trim();
        if (!isNaN(agenteValue)) {
          user.agente_id = parseInt(agenteValue);
        } else {
          user.agente_id = agenteMap.get(agenteValue.toLowerCase()) || 1; // Default a agente 1
        }
      } else {
        user.agente_id = 1; // Default
      }

      // Generar contraseña aleatoria
      const plainPassword = generateRandomPassword();
      user.password = await bcrypt.hash(plainPassword, 12);

      users.push(user);
      generatedPasswords.push({
        email: user.email,
        password: plainPassword,
        name: user.name
      });
    }

    if (users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se encontraron usuarios válidos para procesar',
        errors: errors 
      });
    }

    // Verificar emails duplicados en el archivo y en la base de datos
    const emailCounts = {};
    const duplicateEmails = [];
    
    for (const user of users) {
      if (emailCounts[user.email]) {
        duplicateEmails.push(user.email);
      } else {
        emailCounts[user.email] = 1;
      }
    }

    if (duplicateEmails.length > 0) {
      errors.push(`Emails duplicados en el archivo: ${duplicateEmails.join(', ')}`);
    }

    // Verificar emails existentes en BD
    const emailList = users.map(u => u.email);
    const [existingUsers] = await conn.execute(
      `SELECT email FROM users WHERE email IN (${emailList.map(() => '?').join(',')})`,
      emailList
    );

    const existingEmails = existingUsers.map(u => u.email);
    if (existingEmails.length > 0) {
      errors.push(`Emails ya registrados: ${existingEmails.join(', ')}`);
    }

    // Filtrar usuarios con emails existentes o duplicados
    const validUsers = users.filter(user => 
      !existingEmails.includes(user.email) && 
      !duplicateEmails.includes(user.email)
    );

    const validPasswords = generatedPasswords.filter(pass => 
      !existingEmails.includes(pass.email) && 
      !duplicateEmails.includes(pass.email)
    );

    if (validUsers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay usuarios válidos para crear después de las validaciones',
        errors: errors 
      });
    }

    // Insertar usuarios en la base de datos
    await conn.beginTransaction();

    try {
      const insertPromises = validUsers.map(user => 
        conn.execute(
          `INSERT INTO users (name, email, documento, apellido, password, rol_id, zona_id, regional_id, agente_id, created_at, update_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [user.name, user.email, user.documento, user.apellido, user.password, user.rol_id, user.zona_id, user.regional_id, user.agente_id]
        )
      );

      await Promise.all(insertPromises);
      await conn.commit();

      res.json({
        success: true,
        message: `Se crearon ${validUsers.length} usuarios exitosamente`,
        data: {
          created: validUsers.length,
          total: users.length,
          errors: errors,
          passwords: validPasswords // En producción, envía por email en lugar de retornar
        }
      });

    } catch (insertError) {
      await conn.rollback();
      throw insertError;
    }

  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackError) {
        console.error('Error en rollback:', rollbackError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error al procesar la carga masiva', 
      error: err.message 
    });
  } finally {
    if (conn) conn.release();
  }
});

// Endpoint para descargar plantilla de Excel
router.get('/template', authenticateToken, async (req, res) => {
  try {
    // Crear un nuevo workbook
    const wb = XLSX.utils.book_new();
    
    // Datos de ejemplo
    const templateData = [
      ['nombre', 'email', 'documento', 'apellido', 'rol_id', 'zona_id', 'regional_id', 'agente_id'],
      ['Juan', 'juan@ejemplo.com', '12345678', 'Pérez', '1', '1', '1', '1'],
      ['María', 'maria@ejemplo.com', '87654321', 'González', '2', '1', '1', '1']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Añadir la hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Usuarios');
    
    // Generar buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Configurar headers para descarga
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_usuarios.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(buffer);
    
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al generar plantilla', 
      error: err.message 
    });
  }
});

export default router;
