# API Backend - Endpoints y Protección

## Arquitectura del Backend

El backend está construido con Node.js y Express, utilizando MySQL como base de datos y JWT para autenticación.

### Estructura de Archivos

```
Api/
├── server.js                 # Servidor principal
├── db.js                    # Configuración de base de datos
├── package.json             # Dependencias
├── routes/                  # Rutas públicas y de autenticación
│   ├── auth.js             # Autenticación JWT
│   ├── catalog.js          # Catálogos de productos
│   ├── misc.js             # Utilidades varias
│   ├── mistery.js          # Mystery Shopper
│   └── users.js            # Gestión de usuarios
└── routes_post/            # Rutas protegidas POST
    └── cargar_registros_pdv.js
```

## Configuración del Servidor

### server.js - Configuración Principal

```javascript
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/storage', express.static('storage'));

// Rutas
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/catalog'));
app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/misc'));
app.use('/api', require('./routes/mistery'));
app.use('/api', require('./routes_post/cargar_registros_pdv'));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
```

### db.js - Configuración de Base de Datos

```javascript
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'terpel_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a MySQL');
});

module.exports = db;
```

## Endpoints de Autenticación

### POST /api/login
**Descripción:** Autentica usuario y retorna JWT

```javascript
// Request
{
  "codigo": "string"  // Código único del usuario
}

// Response (éxito)
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_string",
  "user": {
    "id": 123,
    "codigo": "ASE001",
    "nombre": "Juan Pérez",
    "rol": "asesor"
  }
}

// Response (error)
{
  "success": false,
  "message": "Usuario no encontrado"
}
```

**Implementación:**
```javascript
app.post('/api/login', (req, res) => {
  const { codigo } = req.body;
  
  // Buscar usuario en BD
  db.query('SELECT * FROM usuarios WHERE codigo = ?', [codigo], (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = results[0];
    const token = jwt.sign({ userId: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
    
    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        codigo: user.codigo,
        nombre: user.nombre,
        rol: user.rol
      }
    });
  });
});
```

### POST /api/verify-token
**Descripción:** Verifica validez de JWT

```javascript
// Request
{
  "token": "jwt_token_string"
}

// Response (válido)
{
  "valid": true,
  "user": {
    "id": 123,
    "rol": "asesor"
  }
}

// Response (inválido)
{
  "valid": false,
  "message": "Token inválido"
}
```

### POST /api/refresh-token
**Descripción:** Renueva JWT usando refresh token

```javascript
// Request
{
  "refreshToken": "refresh_token_string"
}

// Response
{
  "token": "new_jwt_token"
}
```

### POST /api/logout
**Descripción:** Invalida tokens (logout)

```javascript
// Request
{
  "token": "jwt_token_string"
}

// Response
{
  "success": true,
  "message": "Logout exitoso"
}
```

## Middleware de Protección

### authenticateToken
**Ubicación:** `routes/auth.js`

```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token requerido' 
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
    
    req.user = user;
    next();
  });
};
```

### requireRole
**Ubicación:** `routes/auth.js`

```javascript
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    
    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Sin permisos para este recurso'
      });
    }
    
    next();
  };
};
```

## Endpoints Protegidos

### GET /api/historial-registros/:user_id
**Protección:** JWT + Rol 'asesor'

```javascript
app.get('/api/historial-registros/:user_id', 
  authenticateToken, 
  requireRole(['asesor']), 
  (req, res) => {
    const { user_id } = req.params;
    
    // Verificar que el usuario solo acceda a sus propios datos
    if (req.user.userId !== parseInt(user_id)) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para ver estos datos'
      });
    }
    
    // Query a la base de datos
    db.query(`
      SELECT r.*, u.nombre as agente_nombre 
      FROM registros r 
      JOIN usuarios u ON r.user_id = u.id 
      WHERE r.user_id = ?
      ORDER BY r.fecha DESC
    `, [user_id], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error al obtener historial'
        });
      }
      
      res.json({
        success: true,
        data: results
      });
    });
  }
);
```

### GET /api/registro-detalles/:registro_id
**Protección:** JWT + Rol 'asesor'

```javascript
app.get('/api/registro-detalles/:registro_id',
  authenticateToken,
  requireRole(['asesor']),
  (req, res) => {
    const { registro_id } = req.params;
    
    // Query completa con productos y evidencias
    const query = `
      SELECT 
        r.*,
        u.nombre as agente_nombre,
        GROUP_CONCAT(
          CONCAT(rp.producto_id, ':', rp.cantidad, ':', p.nombre)
          SEPARATOR '|'
        ) as productos,
        r.foto_evidencia
      FROM registros r
      LEFT JOIN registro_productos rp ON r.id = rp.registro_id
      LEFT JOIN productos p ON rp.producto_id = p.id
      JOIN usuarios u ON r.user_id = u.id
      WHERE r.id = ? AND r.user_id = ?
      GROUP BY r.id
    `;
    
    db.query(query, [registro_id, req.user.userId], (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Registro no encontrado'
        });
      }
      
      const registro = results[0];
      
      // Procesar productos
      if (registro.productos) {
        registro.productos = registro.productos.split('|').map(prod => {
          const [id, cantidad, nombre] = prod.split(':');
          return { id: parseInt(id), cantidad: parseInt(cantidad), nombre };
        });
      } else {
        registro.productos = [];
      }
      
      res.json({
        success: true,
        data: registro
      });
    });
  }
);
```

## Manejo de Archivos

### Configuración Multer
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'storage', getCurrentDate());
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${getCurrentTime()}.${getFileExtension(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});
```

### POST /api/upload-evidence
**Protección:** JWT + Upload middleware

```javascript
app.post('/api/upload-evidence',
  authenticateToken,
  upload.single('photo'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió archivo'
      });
    }
    
    const fileUrl = `/storage/${getCurrentDate()}/${req.file.filename}`;
    
    res.json({
      success: true,
      fileUrl: fileUrl
    });
  }
);
```

## Endpoints de Catálogos

### GET /api/catalogos
**Protección:** JWT (cualquier rol autenticado)

```javascript
app.get('/api/catalogos', authenticateToken, (req, res) => {
  db.query('SELECT * FROM catalogos WHERE activo = 1', (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener catálogos'
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});
```

### GET /api/productos
**Protección:** JWT (cualquier rol autenticado)

```javascript
app.get('/api/productos', authenticateToken, (req, res) => {
  const { categoria } = req.query;
  
  let query = 'SELECT * FROM productos WHERE activo = 1';
  let params = [];
  
  if (categoria) {
    query += ' AND categoria = ?';
    params.push(categoria);
  }
  
  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener productos'
      });
    }
    
    res.json({
      success: true,
      data: results
    });
  });
});
```

## Manejo de Errores

### Middleware de Errores Global
```javascript
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Archivo muy grande (máximo 5MB)'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});
```

### Códigos de Estado Estándar

| Código | Descripción | Uso |
|--------|-------------|-----|
| 200 | OK | Request exitoso |
| 201 | Created | Recurso creado |
| 400 | Bad Request | Datos inválidos |
| 401 | Unauthorized | No autenticado |
| 403 | Forbidden | Sin permisos |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Error | Error del servidor |

## Configuración de CORS

```javascript
const corsOptions = {
  origin: ['http://localhost:5173', 'https://terpel-app.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
```

## Variables de Entorno

```bash
# .env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=terpel_db
JWT_SECRET=your_jwt_secret_key
REFRESH_SECRET=your_refresh_secret_key
NODE_ENV=development
```

## Testing de Endpoints

### Usando curl
```bash
# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"codigo": "ASE001"}'

# Endpoint protegido
curl -X GET http://localhost:3000/api/historial-registros/123 \
  -H "Authorization: Bearer your_jwt_token"
```

### Usando Postman
1. Crear collection "Terpel API"
2. Configurar variables de entorno
3. Agregar tests de autenticación
4. Documentar responses esperados

---

**Actualizado:** Enero 2025
