// Configuración de logging para diferentes entornos
export const logConfig = {
  development: {
    level: 'debug',
    showTimestamp: true,
    showFullErrors: true,
    logToFile: false
  },
  
  production: {
    level: 'warn',
    showTimestamp: true,
    showFullErrors: false,
    logToFile: true
  },
  
  testing: {
    level: 'error',
    showTimestamp: false,
    showFullErrors: false,
    logToFile: false
  }
};

// Obtener configuración actual basada en NODE_ENV
export function getCurrentLogConfig() {
  const env = process.env.NODE_ENV || 'development';
  return logConfig[env] || logConfig.development;
}

// Función para verificar si se debe mostrar un log en el nivel actual
export function shouldLog(messageLevel, currentLevel = getCurrentLogConfig().level) {
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  return levels[messageLevel] <= levels[currentLevel];
}
