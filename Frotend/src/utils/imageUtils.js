// Utilidad para manejar URLs de imágenes almacenadas
import { CONFIG } from '../config.js';

/**
 * Construye la URL completa para una imagen almacenada
 * @param {string} rutaRelativa - Ruta relativa de la imagen (ej: "2025-07-25/1753476876193-15-54-36.png")
 * @returns {string} URL completa de la imagen
 */
export const construirUrlImagen = (rutaRelativa) => {
  if (!rutaRelativa) return null;
  
  // Si ya es una URL completa, devolverla tal como está
  if (rutaRelativa.startsWith('http://') || rutaRelativa.startsWith('https://')) {
    return rutaRelativa;
  }
  
  // Limpiar la ruta de prefijos innecesarios
  let rutaLimpia = rutaRelativa.trim();
  
  // Remover múltiples "/storage/" del inicio si existen
  while (rutaLimpia.startsWith('/storage/')) {
    rutaLimpia = rutaLimpia.replace('/storage/', '');
  }
  
  // Remover múltiples "storage/" del inicio si existen
  while (rutaLimpia.startsWith('storage/')) {
    rutaLimpia = rutaLimpia.replace('storage/', '');
  }
  
  // Remover múltiples "/uploads/" del inicio si existen
  while (rutaLimpia.startsWith('/uploads/')) {
    rutaLimpia = rutaLimpia.replace('/uploads/', '');
  }
  
  // Remover múltiples "uploads/" del inicio si existen
  while (rutaLimpia.startsWith('uploads/')) {
    rutaLimpia = rutaLimpia.replace('uploads/', '');
  }
  
  // Construir la URL completa
  const baseUrl = CONFIG.STORAGE_BASE_URL;
  const urlCompleta = `${baseUrl}/${rutaLimpia}`;
  
  return urlCompleta;
};

/**
 * Procesa un string de fotos separadas por comas y devuelve URLs completas
 * @param {string} fotosString - String con rutas separadas por comas
 * @returns {string[]} Array de URLs completas
 */
export const procesarFotosString = (fotosString) => {
  if (!fotosString) return [];
  
  return fotosString
    .split(',')
    .map(foto => foto.trim())
    .filter(foto => foto && foto !== 'null' && foto !== '')
    .map(foto => construirUrlImagen(foto))
    .filter(url => url !== null);
};

/**
 * Abre una imagen en una nueva pestaña
 * @param {string} rutaRelativa - Ruta relativa de la imagen
 */
export const abrirImagenEnNuevaPestana = (rutaRelativa) => {
  const urlCompleta = construirUrlImagen(rutaRelativa);
  if (urlCompleta) {
    window.open(urlCompleta, '_blank');
  }
};
