// components/asesor/FotosImplementacion.jsx
import React from 'react';
import { ImageDisplay } from '../shared/ImageDisplay.jsx';

/**
 * Componente para mostrar fotos de implementación con URLs remotas
 * @param {Object} props - Props del componente
 * @param {Array} props.fotosImplementacion - Array de URLs de fotos de implementación
 * @param {Array} props.fotosFactura - Array de URLs de fotos de factura
 * @param {string} props.className - Clases CSS adicionales
 */
export const FotosImplementacion = ({ 
  fotosImplementacion = [], 
  fotosFactura = [], 
  className = '' 
}) => {

  return (
    <div className={`fotos-implementacion-container ${className}`}>
      
      {/* Sección de Fotos de Factura */}
      {fotosFactura.length > 0 && (
        <div className="fotos-section">
          <h4>📄 Fotos de Factura ({fotosFactura.length})</h4>
          <div className="fotos-grid">
            {fotosFactura.map((fotoUrl, index) => (
              <div key={`factura-${index}`} className="foto-item">
                <ImageDisplay
                  src={fotoUrl}
                  alt={`Factura ${index + 1}`}
                  className="foto-factura"
                  fallbackSrc="/placeholder-receipt.png"
                />
                <div className="foto-label">Factura {index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección de Fotos de Implementación */}
      {fotosImplementacion.length > 0 && (
        <div className="fotos-section">
          <h4>🏪 Fotos de Implementación ({fotosImplementacion.length})</h4>
          <div className="fotos-grid">
            {fotosImplementacion.map((fotoUrl, index) => (
              <div key={`implementacion-${index}`} className="foto-item">
                <ImageDisplay
                  src={fotoUrl}
                  alt={`Implementación ${index + 1}`}
                  className="foto-implementacion"
                  fallbackSrc="/placeholder-store.png"
                />
                <div className="foto-label">Implementación {index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje si no hay fotos */}
      {fotosFactura.length === 0 && fotosImplementacion.length === 0 && (
        <div className="sin-fotos-message">
          <p>📷 No hay fotos disponibles para este registro</p>
        </div>
      )}
    </div>
  );
};

/**
 * Componente específico para modal de detalles de registro
 */
export const FotosRegistroModal = ({ registro }) => {
  // Extraer URLs de fotos del registro
  const fotosFactura = Array.isArray(registro?.fotos?.factura) 
    ? registro.fotos.factura 
    : [];
    
  const fotosImplementacion = Array.isArray(registro?.fotos?.implementacion) 
    ? registro.fotos.implementacion 
    : [];

  return (
    <FotosImplementacion
      fotosFactura={fotosFactura}
      fotosImplementacion={fotosImplementacion}
      className="fotos-modal"
    />
  );
};

export default FotosImplementacion;
