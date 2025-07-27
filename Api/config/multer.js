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

// Configuración de multer con validaciones
export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: function (req, file, cb) {
    // Permitir solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

export default upload;
