// ============================================================
// utils/logger.js
// Logging terstruktur: [timestamp] [LEVEL] [module] message
// Pakai: const logger = require('../utils/logger')('nama-module');
// ============================================================

function timestamp() {
  return new Date().toISOString();
}

function format(level, moduleName, message) {
  return `[${timestamp()}] [${level}] [${moduleName}] ${message}`;
}

function createLogger(moduleName) {
  return {
    info: (message) => console.log(format('INFO', moduleName, message)),
    warn: (message) => console.warn(format('WARN', moduleName, message)),
    error: (message) => console.error(format('ERROR', moduleName, message)),
    debug: (message) => {
      if (process.env.LOG_LEVEL === 'debug') {
        console.log(format('DEBUG', moduleName, message));
      }
    },
  };
}

module.exports = createLogger;
