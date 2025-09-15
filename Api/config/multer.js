// config/multer.js
import multer from 'multer';
import path from 'path';
import { getCurrentStorageConfig, ensureStorageDirectories, generateUniqueFileName } from './storage.js';

/**
 * Configuración de multer para subida de archivos
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const config = getCurrentStorageConfig();
      const todayPath = ensureStorageDirectories(config.basePath);
      cb(null, todayPath);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    try {
      const uniqueName = generateUniqueFileName(file.originalname);
      cb(null, uniqueName);
    } catch (error) {
      cb(error, null);
    }
  }
});

// Configuración de multer con validaciones más permisivas para móviles
export const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo para múltiples archivos
    fieldSize: 10 * 1024 * 1024, // 10MB por campo
    fields: 50, // Máximo 50 campos
    files: 20   // Máximo 20 archivos
  },
  fileFilter: function (req, file, cb) {
    // Permitir solo imágenes con más tipos
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/webp', 'image/bmp', 'image/tiff'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.error(`Tipo de archivo no permitido: ${file.mimetype}`);
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten imágenes.`), false);
    }
  }
});

export default upload;
