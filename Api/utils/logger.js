// Sistema de logging centralizado
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor() {
    // En producción solo mostrar errores y warnings
    this.level = process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    this.showTimestamp = process.env.NODE_ENV !== 'production';
  }

  _log(level, levelName, message, ...args) {
    if (level <= this.level) {
      const timestamp = this.showTimestamp ? `[${new Date().toISOString()}] ` : '';
      const prefix = `${timestamp}${levelName}:`;
      
      if (args.length > 0) {
        console.log(prefix, message, ...args);
      } else {
        console.log(prefix, message);
      }
    }
  }

  error(message, ...args) {
    this._log(LOG_LEVELS.ERROR, 'ERROR', message, ...args);
  }

  warn(message, ...args) {
    this._log(LOG_LEVELS.WARN, 'WARN', message, ...args);
  }

  info(message, ...args) {
    this._log(LOG_LEVELS.INFO, 'INFO', message, ...args);
  }

  debug(message, ...args) {
    this._log(LOG_LEVELS.DEBUG, 'DEBUG', message, ...args);
  }

  // Método para logging de acceso/seguridad (siempre se muestra)
  security(message, ...args) {
    const timestamp = `[${new Date().toISOString()}] `;
    console.log(`${timestamp}SECURITY:`, message, ...args);
  }

  // Método para métricas importantes (siempre se muestra)
  metric(message, ...args) {
    const timestamp = `[${new Date().toISOString()}] `;
    console.log(`${timestamp}METRIC:`, message, ...args);
  }
}

// Instancia global
const logger = new Logger();

export default logger;
