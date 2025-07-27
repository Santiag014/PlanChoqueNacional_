// config/storage.js
import path from 'path';
import fs from 'fs';

/**
 * Configuración de storage para diferentes entornos
 */
export const storageConfig = {
  development: {
    // En desarrollo local
    basePath: path.join(process.cwd(), 'uploads'),
    publicUrl: 'http://localhost:3001/uploads',
    webUrl: 'http://localhost:5173' // URL del frontend en desarrollo
  },
  production: {
    // En producción (VPS Hostinger)
    basePath: '/home/u123456789/sub/public_html/storage',
    publicUrl: 'https://api.plandelamejorenergia.com/uploads',
    webUrl: 'https://plandelamejorenergia.com' // URL del frontend en producción
  }
};

/**
 * Obtiene la configuración actual basada en NODE_ENV
 */
export const getCurrentStorageConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return storageConfig[env] || storageConfig.development;
};

/**
 * Crea las carpetas necesarias para el storage
 * @param {string} basePath - Ruta base del storage
 */
export const ensureStorageDirectories = (basePath) => {
  try {
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
      console.log(`📁 Carpeta de storage creada: ${basePath}`);
    }
    
    // Crear carpeta para la fecha actual si no existe
    const today = new Date().toISOString().slice(0, 10);
    const todayPath = path.join(basePath, today);
    
    if (!fs.existsSync(todayPath)) {
      fs.mkdirSync(todayPath, { recursive: true });
      console.log(`📁 Carpeta del día creada: ${todayPath}`);
    }
    
    return todayPath;
  } catch (error) {
    console.error('❌ Error creando carpetas de storage:', error);
    throw error;
  }
};

/**
 * Construye la URL completa de un archivo
 * @param {string} relativePath - Ruta relativa del archivo (ej: "storage/2025-07-25/archivo.jpg")
 * @returns {string} URL completa del archivo
 */
export const buildFileUrl = (relativePath) => {
  const config = getCurrentStorageConfig();
  // Remover "storage/" del inicio si existe para evitar duplicación
  const cleanPath = relativePath.replace(/^storage\//, '');
  return `${config.publicUrl}/${cleanPath}`;
};

/**
 * Genera un nombre único para el archivo
 * @param {string} originalName - Nombre original del archivo
 * @returns {string} Nombre único generado
 */
export const generateUniqueFileName = (originalName) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const now = new Date();
  const timeString = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  return `${timestamp}-${timeString}${ext}`;
};
