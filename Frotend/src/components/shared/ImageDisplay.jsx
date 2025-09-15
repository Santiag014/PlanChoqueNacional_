// components/shared/ImageDisplay.jsx
import React, { useState } from 'react';
import { useImageUrl } from '../../hooks/shared/useImageUrl.js';

/**
 * Componente para mostrar imágenes con fallback y carga lazy
 * @param {Object} props - Props del componente
 * @param {string} props.src - Ruta o URL de la imagen
 * @param {string} props.alt - Texto alternativo
 * @param {string} props.className - Clases CSS adicionales
 * @param {string} props.fallbackSrc - Imagen de fallback si falla la carga
 * @param {Function} props.onError - Callback cuando falla la carga
 * @param {Function} props.onLoad - Callback cuando se carga exitosamente
 */
export const ImageDisplay = ({ 
  src, 
  alt = 'Imagen', 
  className = '', 
  fallbackSrc = '/placeholder-image.png',
  onError,
  onLoad,
  ...props 
}) => {
  const { getImageUrl } = useImageUrl();
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener la URL completa de la imagen
  const imageUrl = getImageUrl(src);

  const handleImageError = (e) => {
    setImageError(true);
    setIsLoading(false);
    if (onError) onError(e);
  };

  const handleImageLoad = (e) => {
    setIsLoading(false);
    if (onLoad) onLoad(e);
  };

  // Si no hay URL de imagen y no hay fallback, no renderizar nada
  if (!imageUrl && !fallbackSrc) {
    return null;
  }

  return (
    <div className={`image-display-container ${className}`}>
      {isLoading && (
        <div className="image-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
      <img
        src={imageError ? fallbackSrc : imageUrl}
        alt={alt}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ 
          display: isLoading ? 'none' : 'block',
          width: '100%',
          height: 'auto'
        }}
        {...props}
      />
    </div>
  );
};

/**
 * Componente específico para mostrar fotos de seguimiento
 */
export const FotoSeguimiento = ({ fotoUrl, className = '' }) => {
  return (
    <ImageDisplay
      src={fotoUrl}
      alt="Foto de seguimiento"
      className={`foto-seguimiento ${className}`}
      fallbackSrc="/placeholder-camera.png"
    />
  );
};

export default ImageDisplay;
