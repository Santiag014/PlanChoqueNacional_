// Middleware básico de rate limiting para alta concurrencia
// Sin dependencias externas para mantener simplicidad

const rateLimitStore = new Map();
const heavyOperationStore = new Map();

// Limpiar stores cada 15 minutos
setInterval(() => {
  const now = Date.now();
  
  // Limpiar rate limit general
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 900000) { // 15 minutos
      rateLimitStore.delete(key);
    }
  }
  
  // Limpiar operaciones pesadas
  for (const [key, data] of heavyOperationStore.entries()) {
    if (now - data.resetTime > 3600000) { // 1 hora
      heavyOperationStore.delete(key);
    }
  }
}, 900000); // Cada 15 minutos

// Rate limiting general optimizado para 600+ usuarios simultáneos
export const generalRateLimit = (maxRequests = 500, windowMs = 900000) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    const data = rateLimitStore.get(key);
    
    if (now > data.resetTime) {
      // Reset window
      data.count = 1;
      data.resetTime = now + windowMs;
      return next();
    }
    
    if (data.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Demasiadas solicitudes. Límite: ${maxRequests} por ${Math.round(windowMs/60000)} minutos`,
        retryAfter: Math.round((data.resetTime - now) / 1000)
      });
    }
    
    data.count++;
    next();
  };
};

// Rate limiting para operaciones pesadas (Excel, reportes) - MÁS FLEXIBLE
export const heavyOperationLimit = (maxRequests = 25, windowMs = 3600000) => {
  return (req, res, next) => {
    const key = `heavy_${req.ip || req.connection.remoteAddress || 'unknown'}`;
    const now = Date.now();
    
    if (!heavyOperationStore.has(key)) {
      heavyOperationStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    const data = heavyOperationStore.get(key);
    
    if (now > data.resetTime) {
      // Reset window
      data.count = 1;
      data.resetTime = now + windowMs;
      return next();
    }
    
    if (data.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Límite de operaciones pesadas alcanzado. Límite: ${maxRequests} por hora`,
        retryAfter: Math.round((data.resetTime - now) / 1000),
        type: 'heavy_operation_limit'
      });
    }
    
    data.count++;
    next();
  };
};

// Middleware para operaciones que consumen muchas conexiones DB (optimizado para 2500 conexiones)
export const dbIntensiveLimit = (maxRequests = 100, windowMs = 600000) => {
  return (req, res, next) => {
    const key = `db_${req.ip || req.connection.remoteAddress || 'unknown'}`;
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    const data = rateLimitStore.get(key);
    
    if (now > data.resetTime) {
      data.count = 1;
      data.resetTime = now + windowMs;
      return next();
    }
    
    if (data.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Límite de consultas a base de datos alcanzado. Límite: ${maxRequests} por ${Math.round(windowMs/60000)} minutos`,
        retryAfter: Math.round((data.resetTime - now) / 1000),
        type: 'database_intensive_limit'
      });
    }
    
    data.count++;
    next();
  };
};

// Obtener estadísticas de rate limiting
export const getRateLimitStats = () => {
  const now = Date.now();
  const activeGeneral = Array.from(rateLimitStore.values()).filter(data => now < data.resetTime);
  const activeHeavy = Array.from(heavyOperationStore.values()).filter(data => now < data.resetTime);
  
  return {
    timestamp: new Date().toISOString(),
    activeGeneralLimits: activeGeneral.length,
    activeHeavyLimits: activeHeavy.length,
    totalRequests: activeGeneral.reduce((sum, data) => sum + data.count, 0),
    totalHeavyOperations: activeHeavy.reduce((sum, data) => sum + data.count, 0)
  };
};

// Rate limiting específico para Excel POR IP
export const excelDownloadLimit = (maxRequests = 50, windowMs = 3600000) => {
  return (req, res, next) => {
    const key = `excel_ip_${req.ip || req.connection.remoteAddress || 'unknown'}`;
    const now = Date.now();
    
    if (!heavyOperationStore.has(key)) {
      heavyOperationStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
        identifier: `IP: ${req.ip}`
      });
      return next();
    }
    
    const data = heavyOperationStore.get(key);
    
    if (now > data.resetTime) {
      // Reset window
      data.count = 1;
      data.resetTime = now + windowMs;
      return next();
    }
    
    if (data.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Límite de descargas de Excel alcanzado. Límite: ${maxRequests} por hora por IP`,
        retryAfter: Math.round((data.resetTime - now) / 1000),
        type: 'excel_download_limit_by_ip',
        identifier: data.identifier,
        suggestion: 'Cada IP puede descargar hasta ' + maxRequests + ' Excel por hora.'
      });
    }
    
    data.count++;
    next();
  };
};

// Rate limiting específico para Excel POR USUARIO autenticado
export const excelDownloadLimitByUser = (maxRequests = 30, windowMs = 3600000) => {
  return (req, res, next) => {
    // Usar ID de usuario si está autenticado, sino usar IP
    const userId = req.user?.id || req.user?.email;
    const key = userId ? `excel_user_${userId}` : `excel_ip_${req.ip || req.connection.remoteAddress || 'unknown'}`;
    const now = Date.now();
    
    if (!heavyOperationStore.has(key)) {
      heavyOperationStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
        identifier: userId ? `Usuario: ${userId}` : `IP: ${req.ip}`
      });
      return next();
    }
    
    const data = heavyOperationStore.get(key);
    
    if (now > data.resetTime) {
      // Reset window
      data.count = 1;
      data.resetTime = now + windowMs;
      return next();
    }
    
    if (data.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Límite de descargas de Excel alcanzado. Límite: ${maxRequests} por hora por ${userId ? 'usuario' : 'IP'}`,
        retryAfter: Math.round((data.resetTime - now) / 1000),
        type: 'excel_download_limit_by_user',
        identifier: data.identifier,
        suggestion: 'Cada usuario puede descargar hasta ' + maxRequests + ' Excel por hora.'
      });
    }
    
    data.count++;
    next();
  };
};
