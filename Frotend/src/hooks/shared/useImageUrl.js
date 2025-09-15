// hooks/shared/useImageUrl.js
import { CONFIG } from '../../config.js';

/**
 * Hook para manejar URLs de imágenes desde el backend
 */
export const useImageUrl = () => {
  
  /**
   * Convierte una ruta de imagen (relativa o completa) en una URL completa
   * @param {string} imagePath - Ruta de la imagen (puede ser relativa o URL completa)
   * @returns {string|null} URL completa de la imagen o null si no hay imagen
   */
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // Si ya es una URL completa (empieza con http), devolverla tal como está
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Si es una ruta relativa que empieza con /uploads, construir URL completa
    if (imagePath.startsWith('/uploads/')) {
      return `${CONFIG.API_URL}${imagePath}`;
    }
    
    // Si es una ruta relativa que empieza con /storage, construir URL completa (compatibilidad)
    if (imagePath.startsWith('/storage/')) {
      return `${CONFIG.API_URL}${imagePath}`;
    }
    
    // Si es solo el nombre del archivo o ruta sin barra inicial, construir URL
    const cleanPath = imagePath.replace(/^\/+/, ''); // Remover barras al inicio
    return `${CONFIG.STORAGE_BASE_URL}/${cleanPath}`;
  };

  /**
   * Verifica si una imagen existe haciendo un HEAD request
   * @param {string} imageUrl - URL de la imagen a verificar
   * @returns {Promise<boolean>} Promise que resuelve a true si existe
   */
  const checkImageExists = async (imageUrl) => {
    if (!imageUrl) return false;
    
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn('Error verificando imagen:', error);
      return false;
    }
  };

  /**
   * Obtiene información sobre la configuración de imágenes actual
   * @returns {object} Configuración actual
   */
  const getImageConfig = () => {
    return {
      baseUrl: CONFIG.STORAGE_BASE_URL,
      apiUrl: CONFIG.API_URL,
      environment: import.meta.env.MODE
    };
  };

  return {
    getImageUrl,
    checkImageExists,
    getImageConfig
  };
};
