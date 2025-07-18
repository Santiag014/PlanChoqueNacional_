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

    // Verificar campos obligatorios - ajustados a la estructura real
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
    
    console.log('🔌 Estableciendo conexión con la base de datos...');
    
    try {
      // Usar la conexión mejorada con reintentos
      conn = await getConnection(3);
      
      // Verificar que la conexión está activa
      await conn.execute('SELECT 1');
      console.log('✅ Conexión a la base de datos establecida correctamente');
      
      // Configurar un ping periódico para mantener la conexión activa
      const pingInterval = setInterval(async () => {
        try {
          if (conn) {
            console.log('🔄 Manteniendo conexión activa (ping)...');
            await conn.execute('SELECT 1');
          }
        } catch (pingError) {
          console.error('❌ Error en ping de conexión:', pingError.message);
        }
      }, 30000); // Ping cada 30 segundos
      
      // Asegurar que el intervalo se limpiará cuando terminemos
      setTimeout(() => {
        clearInterval(pingInterval);
      }, 30 * 60 * 1000); // Máximo 30 minutos
      
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

    for (let i = 1; i < jsonData.length; i++) { // Empezar desde 1 para saltar encabezados
      const row = jsonData[i];
      
      if (!row || row.length === 0 || !row[columnIndices.name]) {
        continue; // Saltar filas vacías
      }

      const user = {
        name: row[columnIndices.name]?.toString().trim(),
        email: row[columnIndices.email]?.toString().trim().toLowerCase(),
        documento: row[columnIndices.documento]?.toString().trim(),
        rol_id: null,
        IsPromotoria: null,
        agente_id: null,
        ciudad_id: null
      };

      // Validar email
      if (!isValidEmail(user.email)) {
        errors.push(`Fila ${i + 1}: Email inválido (${user.email})`);
        continue;
      }

      // Procesar rol_id - usar directamente el valor como ID
      if (columnIndices.rol_id !== undefined && row[columnIndices.rol_id]) {
        const rolValue = row[columnIndices.rol_id].toString().trim();
        user.rol_id = !isNaN(rolValue) ? parseInt(rolValue) : 1; // Si no es número, usar rol 1 por defecto
      } else {
        user.rol_id = 1; // Default
      }

      // Procesar IsPromotoria (0 = No, 1 = Sí)
      if (columnIndices.IsPromotoria !== undefined && row[columnIndices.IsPromotoria]) {
        const promotoriaValue = row[columnIndices.IsPromotoria].toString().trim().toLowerCase();
        if (promotoriaValue === '1' || promotoriaValue === 'si' || promotoriaValue === 'sí' || promotoriaValue === 'yes' || promotoriaValue === 'true') {
          user.IsPromotoria = 1;
        } else {
          user.IsPromotoria = 0;
        }
      } else {
        user.IsPromotoria = 0; // Default: No es promotoria
      }

      // Procesar agente_id - usar directamente el valor como ID
      if (columnIndices.agente_id !== undefined && row[columnIndices.agente_id]) {
        const agenteValue = row[columnIndices.agente_id].toString().trim();
        user.agente_id = !isNaN(agenteValue) ? parseInt(agenteValue) : 1; // Si no es número, usar agente 1 por defecto
      } else {
        user.agente_id = 1; // Default
      }

      // Procesar ciudad_id - usar directamente el valor como ID
      if (columnIndices.ciudad_id !== undefined && row[columnIndices.ciudad_id]) {
        const ciudadValue = row[columnIndices.ciudad_id].toString().trim();
        user.ciudad_id = !isNaN(ciudadValue) ? parseInt(ciudadValue) : 1; // Si no es número, usar ciudad 1 por defecto
      } else {
        user.ciudad_id = 1; // Default
      }

      // Usar el documento como contraseña (más práctico para los usuarios)
      const plainPassword = user.documento; // La contraseña será el número de documento
      user.password = await bcrypt.hash(plainPassword, 12);

      users.push(user);
      generatedPasswords.push({
        email: user.email,
        password: plainPassword, // Será el número de documento
        documento: user.documento,
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

    // Desactivando verificación de emails existentes (por solicitud del usuario)
    console.log('Omitiendo validación de emails existentes en la BD...');
    let existingEmails = [];
    
    // Deshabilitando filtrado por emails duplicados en BD
    // Solo filtramos por duplicados dentro del mismo archivo
    const validUsers = users.filter(user => 
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
    try {
      console.log('🔄 Verificando que la conexión sigue activa...');
      // Verificar que la conexión sigue activa antes de iniciar la transacción
      await conn.execute('SELECT 1');
      
      console.log('🔄 Iniciando transacción en la base de datos...');
      // Iniciar transacción
      await conn.beginTransaction();
      
      // Insertar usuarios uno por uno para mostrar progreso en tiempo real
      let successCount = 0;
      const totalUsers = validUsers.length;
      
      // Dividir en lotes más pequeños para procesar
      const BATCH_SIZE = 20; // Procesar 20 usuarios a la vez
      const batches = Math.ceil(validUsers.length / BATCH_SIZE);
      
      console.log(`\n----- Iniciando creación de ${totalUsers} usuarios en ${batches} lotes -----\n`);
      
      // Para cada lote
      for (let batch = 0; batch < batches; batch++) {
        const start = batch * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, validUsers.length);
        const batchUsers = validUsers.slice(start, end);
        
        console.log(`\n🔄 Procesando lote ${batch + 1}/${batches} (usuarios ${start + 1}-${end})`);
        
        // Reiniciar la transacción para cada lote
        if (batch > 0) {
          await conn.commit();
          console.log('✅ Commit del lote anterior completado');
          await conn.beginTransaction();
          console.log('🔄 Nueva transacción iniciada para este lote');
        }
        
        // Procesar cada usuario del lote
        for (let i = 0; i < batchUsers.length; i++) {
          const user = batchUsers[i];
          const userIndex = start + i;
          const startUserTime = Date.now();
          
          try {
            console.log(`📝 Procesando usuario ${userIndex + 1}/${totalUsers}: ${user.name} (${user.email})`);
            
            try {
              // Intentar insertar ignorando duplicados
              await conn.execute(
                `INSERT IGNORE INTO users (name, email, documento, password, rol_id, IsPromotoria, agente_id, ciudad_id, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [user.name, user.email, user.documento, user.password, user.rol_id, user.IsPromotoria, user.agente_id, user.ciudad_id]
              );
              
              // Incrementar contador y mostrar progreso
              successCount++;
              const percent = Math.round((successCount / totalUsers) * 100);
              const timeElapsed = ((Date.now() - startUserTime) / 1000).toFixed(2);
              console.log(`✅ [${successCount}/${totalUsers}] (${percent}%) Usuario creado/actualizado: ${user.name} (${user.email}) - Tiempo: ${timeElapsed}s`);
            } catch (insertError) {
              // Si falla INSERT IGNORE, intentamos actualizar en su lugar
              if (insertError.code === 'ER_DUP_ENTRY') {
                console.log(`⚠️ Entrada duplicada detectada para ${user.name} (${user.email}), actualizando...`);
                
                // Determinar qué campo está causando el duplicado
                const errorMsg = insertError.sqlMessage || '';
                const isEmailDup = errorMsg.includes("'email'");
                const isDocumentoDup = errorMsg.includes("'documento'");
                
                // Actualizar solo algunos campos (no actualizamos email/documento si son la causa del duplicado)
                await conn.execute(
                  `UPDATE users SET 
                    name = ?, 
                    ${!isEmailDup ? 'email = ?,' : ''} 
                    ${!isDocumentoDup ? 'documento = ?,' : ''} 
                    password = ?,
                    rol_id = ?, 
                    IsPromotoria = ?, 
                    agente_id = ?, 
                    ciudad_id = ?, 
                    updated_at = NOW()
                  WHERE ${isEmailDup ? 'email = ?' : 'documento = ?'}`,
                  [
                    user.name,
                    ...(isEmailDup ? [] : [user.email]),
                    ...(isDocumentoDup ? [] : [user.documento]),
                    user.password,
                    user.rol_id,
                    user.IsPromotoria, 
                    user.agente_id,
                    user.ciudad_id,
                    isEmailDup ? user.email : user.documento
                  ]
                );
                
                successCount++;
                const percent = Math.round((successCount / totalUsers) * 100);
                console.log(`🔄 [${successCount}/${totalUsers}] (${percent}%) Usuario actualizado: ${user.name} (${user.email})`);
              } else {
                // Si es otro error, lo registramos
                throw insertError;
              }
            }
          } catch (userError) {
            console.error(`❌ Error al procesar usuario ${user.name} (${user.email}): ${userError.message}`);
            errors.push(`Error al procesar usuario ${user.name}: ${userError.message}`);
          }
          
          // Hacer commit parcial cada 50 usuarios para evitar transacciones muy largas
          if (successCount % 50 === 0 && userIndex < totalUsers - 1) {
            await conn.commit();
            console.log(`\n--- Commit parcial: ${successCount} usuarios guardados. Continuando... ---\n`);
            await conn.beginTransaction();
          }
        }
      }
      
      console.log(`\n----- Creación de usuarios completada: ${successCount}/${totalUsers} -----\n`);
      
      // Confirmar cambios
      await conn.commit();
      
      console.log(`\n----- Resumen de operación -----`);
      console.log(`Total de usuarios en el archivo: ${users.length}`);
      console.log(`Usuarios creados exitosamente: ${successCount}`);
      console.log(`Usuarios omitidos (emails duplicados/existentes): ${users.length - validUsers.length}`);
      console.log(`Errores de creación: ${errors.length}`);
      console.log(`------------------------------\n`);

      res.json({
        success: true,
        message: `Se crearon ${successCount} usuarios exitosamente. La contraseña de cada usuario es su número de documento.`,
        data: {
          created: successCount,
          total: users.length,
          omitidos: users.length - validUsers.length,
          errores: errors,
          usuarios_creados: validPasswords.slice(0, successCount).map(u => ({
            nombre: u.name,
            email: u.email,
            documento: u.documento
            // No devolver contraseñas por seguridad
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
    console.error('Error detallado:', err);
    
    if (conn) {
      try {
        // Verificar si la conexión sigue activa
        try {
          await conn.execute('SELECT 1');
          // Si llegamos aquí, la conexión sigue activa y podemos hacer rollback
          await conn.rollback();
        } catch (connectionError) {
          console.error('Conexión cerrada, obteniendo nueva conexión para rollback');
          // Si la conexión está cerrada, intentamos obtener una nueva para hacer rollback
          try {
            const newConn = await getConnection();
            await newConn.execute('SELECT 1');
            await newConn.rollback();
            newConn.release();
          } catch (newConnError) {
            console.error('No se pudo obtener nueva conexión para rollback:', newConnError);
          }
        }
      } catch (rollbackError) {
        console.error('Error en rollback:', rollbackError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error al procesar la carga masiva', 
      error: err.message,
      stack: err.stack // Incluir stack trace para mejor depuración
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
