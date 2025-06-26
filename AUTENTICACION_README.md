# Sistema de Autenticación JWT - Plan Choque Nacional

## Resumen
Se ha implementado un sistema completo de autenticación por tokens JWT para proteger las rutas de la aplicación y del API.

## Estructura de Hooks Organizados por Rol

### 📁 /hooks
```
├── auth/                   # Hooks de autenticación
│   ├── useAuth.js         # Hook base de autenticación
│   ├── useProtectedRoute.js # Hook para rutas protegidas
│   └── index.js           # Exportaciones
├── asesor/                # Hooks específicos del asesor
│   ├── useMetasDashboard.js
│   ├── useKpiCalculations.js
│   ├── useKpiManagement.js
│   └── index.js
├── pdv/                   # Hooks específicos del PDV
│   ├── usePdvData.js
│   ├── useProductSelection.js
│   ├── useReportSubmission.js
│   └── index.js
├── shared/                # Hooks compartidos
│   ├── useResponsive.js
│   ├── useCatalogos.js
│   ├── useHomeNavigation.js
│   └── index.js
└── index.js              # Exportaciones principales
```

## Hooks de Autenticación

### useAuth()
Hook principal que maneja:
- Login con credenciales
- Verificación de token automática
- Logout
- Refresh de token
- Headers de autenticación
- Fetch autenticado

### useProtectedRoute(allowedRoles, redirectTo)
Hook para proteger rutas por rol:
```jsx
// Solo asesores
const { user, loading, isAuthenticated } = useAsesorRoute();

// Múltiples roles
const { user } = useMultiRoleRoute(['asesor', 'pdv']);

// Solo autenticación requerida
const { user } = useAuthRequired();
```

## Implementación en Componentes

### Ejemplo: Página de Asesor
```jsx
import { useAsesorRoute } from '../../hooks/auth';
import { useMetasDashboard } from '../../hooks/asesor';

export default function MetasPage() {
  // Protección automática de ruta
  const { user, loading, isAuthenticated, hasRequiredRole } = useAsesorRoute();
  
  // Loading state
  if (loading) {
    return <div>Verificando autenticación...</div>;
  }

  // Auto-redirect si no autorizado
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  // Hook específico del asesor
  const { dashboardData, loading: dataLoading } = useMetasDashboard(user);

  return (
    <DashboardLayout user={user}>
      {/* Contenido */}
    </DashboardLayout>
  );
}
```

## Sistema Backend JWT

### Endpoints de Autenticación
- `POST /api/auth/login` - Login con email/password
- `POST /api/auth/verify-token` - Verificar validez del token
- `POST /api/auth/refresh-token` - Renovar token
- `POST /api/auth/logout` - Logout

### Middleware de Protección
```javascript
// Protección básica
router.get('/protected-route', authenticateToken, handler);

// Protección por rol
router.get('/asesor-route', authenticateToken, requireAsesor, handler);

// Protección múltiple
router.get('/multi-role', authenticateToken, requireAnyRole('asesor', 'pdv'), handler);
```

### Headers de Autenticación
```javascript
// Frontend envía
Authorization: Bearer <jwt-token>

// Backend valida y agrega a req.user:
{
  userId: 123,
  email: "usuario@ejemplo.com",
  tipo: "asesor",
  nombre: "Juan Pérez"
}
```

## Flujo de Autenticación

### 1. Login
1. Usuario ingresa credenciales
2. Frontend envía POST a `/api/auth/login`
3. Backend valida y genera JWT
4. Token se guarda en localStorage
5. Usuario se redirige a su dashboard

### 2. Navegación Protegida
1. Usuario intenta acceder a ruta `/asesor/metas`
2. `useAsesorRoute()` verifica:
   - Token existe en localStorage
   - Token es válido (llamada a `/api/auth/verify-token`)
   - Usuario tiene rol 'asesor'
3. Si pasa: renderiza página
4. Si falla: redirige a login o página no autorizada

### 3. Llamadas API Autenticadas
```javascript
// Hook automáticamente agrega headers
const { authenticatedFetch } = useAuthContext();
const response = await authenticatedFetch('/api/dashboard-kpi/123');
```

### 4. Expiración de Token
1. Token expira (24h por defecto)
2. Siguiente request devuelve 401
3. Hook de auth detecta y hace logout automático
4. Usuario es redirigido al login

## Configuración de Rutas

### App.jsx
```jsx
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Rutas protegidas - automáticamente verificadas */}
          <Route path="/asesor/*" element={<AsesorPages />} />
          <Route path="/pdv/*" element={<PdvPages />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## Tipos de Usuario

### Asesor
- Rol: `'asesor'`
- Acceso a: `/asesor/*`
- Funcionalidades: Metas, KPIs, Ranking, etc.

### PDV
- Rol: `'pdv'`
- Acceso a: `/pdv/*`
- Funcionalidades: Registros, Reportes, etc.

### Mystery Shopper
- Rol: `'misteryshopper'`
- Acceso a: `/misteryShopper/*`
- Funcionalidades: Visitas, Evaluaciones, etc.

**Nota:** El sistema actualmente maneja dos roles principales: `asesor` y `misteryshopper`. Las funcionalidades de PDV están integradas dentro del rol de asesor.

## Seguridad

### Frontend
- Tokens en localStorage (considerar httpOnly cookies para producción)
- Validación automática en cada ruta protegida
- Logout automático en token expirado
- Verificación de roles en tiempo real

### Backend
- JWT con secret seguro
- Middleware de autenticación en rutas sensibles
- Validación de permisos por endpoint
- Logging de acceso para auditoría
- Headers CORS configurados

## Variables de Entorno

### Backend (.env)
```
JWT_SECRET=tu-secret-super-seguro-aqui
JWT_EXPIRES_IN=24h
```

## Próximos Pasos

1. ✅ Sistema de autenticación implementado
2. ✅ Hooks organizados por rol
3. ✅ Rutas protegidas
4. ✅ Middleware de backend

### Mejoras Futuras
- [ ] Refresh automático de tokens
- [ ] Blacklist de tokens revocados
- [ ] Rate limiting
- [ ] Logs de auditoría mejorados
- [ ] Migrar a httpOnly cookies
- [ ] Implementar permisos granulares

## Uso Recomendado

### Para Nuevas Páginas
1. Importar el hook de protección adecuado
2. Verificar autenticación al inicio del componente
3. Usar hooks específicos del rol para data
4. Pasar `user` al DashboardLayout

### Para Nuevos Hooks
1. Ubicar en la carpeta del rol correspondiente
2. Usar `useAuthContext()` para obtener `authenticatedFetch`
3. Manejar errores 401/403 apropiadamente
4. Exportar desde el index del rol

### Para Nuevas Rutas API
1. Importar middleware apropiado
2. Aplicar `authenticateToken` para rutas protegidas
3. Usar `requireRole` para restricciones específicas
4. Validar que usuarios solo accedan a sus datos
