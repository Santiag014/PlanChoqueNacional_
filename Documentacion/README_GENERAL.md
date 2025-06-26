# Sistema de Puntos Terpel - Plan Choque Nacional

## Descripción General

El Sistema de Puntos Terpel es una aplicación web diseñada para gestionar y monitorear el desempeño de asesores de ventas en estaciones de servicio Terpel. La aplicación permite el registro de actividades, seguimiento de KPIs, y gestión de catálogos de productos.

## Arquitectura del Sistema

### Estructura del Proyecto

```
├── Api/                          # Backend Node.js/Express
│   ├── db.js                     # Configuración de base de datos
│   ├── server.js                 # Servidor principal
│   ├── routes/                   # Rutas públicas y de autenticación
│   └── routes_post/              # Rutas protegidas POST
├── PlanChoqueTerpel/             # Frontend React + Vite
│   ├── src/
│   │   ├── components/           # Componentes React organizados por rol
│   │   ├── hooks/               # Hooks personalizados por funcionalidad
│   │   ├── pages/               # Páginas principales
│   │   ├── services/            # Servicios API
│   │   └── styles/              # Estilos CSS organizados
│   └── public/                  # Archivos estáticos
└── Documentacion/               # Documentación del proyecto
```

### Tecnologías Utilizadas

**Backend:**
- Node.js con Express
- MySQL como base de datos
- JWT para autenticación
- Multer para manejo de archivos
- CORS para peticiones cross-origin

**Frontend:**
- React 18 con Vite
- React Router DOM para navegación
- Context API para estado global
- CSS personalizado con diseño responsive
- Componentes modulares organizados por rol

## Flujo Principal de la Aplicación

### 1. Autenticación
- Login con código de asesor
- Verificación de token JWT
- Renovación automática de tokens
- Protección de rutas por rol

### 2. Navegación por Roles
- **Asesor**: Acceso a home, registros, historial
- **Mystery Shopper**: Acceso a formularios de evaluación
- Navegación protegida según permisos

### 3. Funcionalidades Principales
- Registro de actividades de ventas
- Carga de evidencias fotográficas
- Seguimiento de KPIs (Volumen, Precio, Frecuencia)
- Historial de registros con filtros
- Evaluaciones Mystery Shopper

## Roles de Usuario

### Asesor de Ventas
- Registra actividades diarias
- Consulta catálogos de productos
- Ve su historial de registros
- Accede a navegación móvil optimizada

### Mystery Shopper
- Realiza evaluaciones de estaciones
- Registra observaciones y evidencias
- Genera reportes de cumplimiento

## Características Técnicas

### Seguridad
- Autenticación JWT con expiración
- Middleware de verificación de roles
- Protección de endpoints sensibles
- Validación de datos en frontend y backend

### Responsividad
- Diseño mobile-first
- Navegación por carrusel en móvil
- Adaptación automática a diferentes pantallas
- Optimización para dispositivos táctiles

### Performance
- Carga lazy de componentes
- Optimización de imágenes
- Manejo eficiente de estado
- API REST optimizada

## Estructura de Base de Datos

La aplicación utiliza varias tablas principales:
- `usuarios`: Gestión de usuarios y roles
- `registros`: Actividades de asesores
- `kpis`: Indicadores de desempeño
- `catalogos`: Products y información
- `mystery_evaluations`: Evaluaciones mystery

## Instalación y Configuración

Ver archivos específicos:
- `INSTALACION.md` - Guía de instalación completa
- `CONFIGURACION.md` - Configuración del entorno
- `DESARROLLO.md` - Guía para desarrolladores

## Mantenimiento y Soporte

### Logs y Monitoreo
- Logs de errores en consola
- Seguimiento de autenticación
- Monitoreo de rendimiento

### Actualizaciones
- Versionado semántico
- Documentación de cambios
- Testing antes de despliegue

## Contacto y Soporte

Para soporte técnico o consultas sobre el desarrollo, contactar al equipo de desarrollo de Bull Marketing SAS.

---

**Última actualización:** Enero 2025
**Versión:** 1.0.0
