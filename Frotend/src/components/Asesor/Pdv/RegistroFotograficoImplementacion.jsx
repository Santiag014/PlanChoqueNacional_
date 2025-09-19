import React, { useState, useEffect } from 'react';
import '../../../styles/Asesor/asesor-registro-fotografico-implementacion.css';

/**
 * Componente para el registro fotográfico de implementación
 * Muestra una fila fija para la implementación seleccionada
 */
const RegistroFotograficoImplementacion = ({ 
  implementacionSeleccionada, 
  fotosImplementacion, 
  setFotosImplementacion,
  fotoRemision,
  setFotoRemision
}) => {

  // Función para calcular hash de archivo
  const getFileHash = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        if (window.crypto && window.crypto.subtle) {
          window.crypto.subtle.digest('SHA-1', e.target.result)
            .then(hashBuffer => {
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              resolve(hashHex);
            });
        } else {
          // Fallback: solo por nombre y tamaño
          resolve(file.name + '_' + file.size);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Manejadores de fotos
  const handleFotoImplementacionChange = async (file) => {
    // VALIDACIÓN: Verificar si es la misma foto que la remisión (por hash)
    if (fotoRemision) {
      const hashImplementacion = await getFileHash(file);
      const hashRemision = await getFileHash(fotoRemision);
      if (hashImplementacion === hashRemision) {
        alert('⚠️ ADVERTENCIA: Esta foto ya está seleccionada como foto de remisión (mismo archivo). Por favor, selecciona una foto diferente para la implementación.');
        return;
      }
    }
    setFotosImplementacion(prev => ({
      ...prev,
      [`implementacion_${implementacionSeleccionada.numero}`]: file
    }));
    console.log(`📸 Foto de implementación seleccionada: ${file.name}`);
  };

  const handleRemoveFotoImplementacion = () => {
    setFotosImplementacion(prev => {
      const newFotos = { ...prev };
      delete newFotos[`implementacion_${implementacionSeleccionada.numero}`];
      return newFotos;
    });
  };

  const handleFotoRemisionChange = async (file) => {
    // 🚨 RESTRICCIÓN 1: Verificar que primero se haya seleccionado foto de implementación
    const fotoImplementacion = fotosImplementacion[`implementacion_${implementacionSeleccionada.numero}`];
    if (!fotoImplementacion) {
      alert('⚠️ RESTRICCIÓN: Debes seleccionar primero la foto de implementación antes de cargar la foto de remisión.');
      return;
    }
    // VALIDACIÓN: Verificar si es la misma foto que la implementación (por hash)
    const hashImplementacion = await getFileHash(fotoImplementacion);
    const hashRemision = await getFileHash(file);
    if (hashImplementacion === hashRemision) {
      alert('⚠️ ADVERTENCIA: Esta foto ya está seleccionada como foto de implementación (mismo archivo). Por favor, selecciona una foto diferente para la remisión.');
      return;
    }
    setFotoRemision(file);
    console.log(`📄 Foto de remisión seleccionada: ${file.name}`);
  };

  const handleRemoveFotoRemision = () => {
    setFotoRemision(null);
  };

  if (!implementacionSeleccionada) {
    return (
      <div className="registro-fotografico-implementacion">
        <h3 className="titulo-registro-fotografico">
          Registro Fotográfico de Implementación
        </h3>
        <div className="mensaje-sin-productos">
          <p>Selecciona una implementación para continuar...</p>
        </div>
      </div>
    );
  }

  const fotoImplementacion = fotosImplementacion[`implementacion_${implementacionSeleccionada.numero}`];
  
  return (
    <div className="registro-fotografico-implementacion">
      <h3 className="titulo-registro-fotografico">
        Registro Fotográfico - Implementación {implementacionSeleccionada.numero}
      </h3>
      
      <p className="descripcion-fotos">
        Sube las fotos requeridas para completar el registro de implementación:
      </p>
      
      {/* Información de restricciones PASO A PASO */}
      <div className="info-restricciones" style={{
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        borderRadius: '8px', 
        padding: '15px', 
        marginBottom: '20px'
      }}>
        <div className="info-text">
          <small style={{color: '#856404'}}>⚠️ No podrás cargar la foto de remisión sin antes cargar la foto de implementación</small>
        </div>
      </div>
      
      {/* Información de validación */}
      <div className="info-validacion">
        <div className="info-icon">ℹ️</div>
        <div className="info-text">
          <strong>Fotos requeridas:</strong> 1 foto de la implementación + 1 foto de la remisión = 2 fotos en total.
        </div>
      </div>

      {/* Foto de la implementación */}
      <div className="foto-implementacion-container">
        <h4 className="foto-implementacion-title">
          <span className="implementacion-numero">1</span>
          <span className="implementacion-text">Implementación {implementacionSeleccionada.numero}</span>
        </h4>
        
        <div className="foto-implementacion-card">
          <input
            type="file"
            //accept="image/*"
            accept=".jpg,.jpeg,.png,.gif,.webp"
            id={`foto-implementacion-${implementacionSeleccionada.numero}`}
            className="foto-input-hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files);
              const maxSize = 8 * 1024 * 1024; // 8MB

              const validFiles = files.filter(file => file.size <= maxSize);

              if (validFiles.length !== files.length) {
                alert("⚠️ Algunas fotos superan 8MB y fueron descartadas");
              }

              // Llamar al handler con el primer archivo válido
              if (validFiles.length > 0) {
                handleFotoImplementacionChange(validFiles[0]);
              }
            }}
          />
          
          <div 
            className={`foto-upload-box ${fotoImplementacion ? 'has-photo' : ''}`}
            onClick={() => document.getElementById(`foto-implementacion-${implementacionSeleccionada.numero}`).click()}
          >
            {fotoImplementacion ? (
              <div className="foto-uploaded">
                <div className="foto-preview">
                  <img 
                    src={URL.createObjectURL(fotoImplementacion)} 
                    alt={`Foto de implementación ${implementacionSeleccionada.numero}`}
                    className="foto-thumbnail"
                  />
                </div>
                <div className="foto-details">
                  <span className="foto-name">{fotoImplementacion.name}</span>
                  <button
                    type="button"
                    className="foto-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFotoImplementacion();
                    }}
                  >
                    🗑️ Cambiar
                  </button>
                </div>
              </div>
            ) : (
              <div className="foto-placeholder">
                <span className="upload-icon">📷</span>
                <span className="upload-text">Subir foto de la implementación</span>
                <span className="upload-hint">Toca para seleccionar imagen</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campo adicional para foto de remisión */}
      <div className="foto-remision-container">
        <h4 className="foto-remision-title">
          <span className="remision-icon">📄</span>
          Foto de la Remisión
          {!fotoImplementacion && <span style={{color: '#e74c3c', fontSize: '14px'}}> (Deshabilitado - Sube primero la foto de implementación)</span>}
        </h4>
        <div className="foto-remision-card">
          <input
            type="file"
            //accept="image/*"
            accept=".jpg,.jpeg,.png,.gif,.webp"
            id="foto-remision"
            className="foto-input-hidden"
            disabled={!fotoImplementacion}
            onChange={(e) => {
              const files = Array.from(e.target.files);
              const maxSize = 8 * 1024 * 1024; // 8MB     

              const validFiles = files.filter(file => file.size <= maxSize);

              if (validFiles.length !== files.length) {
                alert("⚠️ Algunas fotos superan 8MB y fueron descartadas");
              }

              // Llamar al handler con el primer archivo válido
              if (validFiles.length > 0) {
                handleFotoRemisionChange(validFiles[0]);
              }
            }}
          />
          
          <div 
            className={`foto-upload-box ${fotoRemision ? 'has-photo' : ''} ${!fotoImplementacion ? 'disabled' : ''}`}
            onClick={() => {
              if (fotoImplementacion) {
                document.getElementById('foto-remision').click();
              }
            }}
            style={{
              opacity: !fotoImplementacion ? 0.5 : 1,
              cursor: !fotoImplementacion ? 'not-allowed' : 'pointer'
            }}
          >
            {fotoRemision ? (
              <div className="foto-uploaded">
                <div className="foto-preview">
                  <img 
                    src={URL.createObjectURL(fotoRemision)} 
                    alt="Foto de la remisión"
                    className="foto-thumbnail"
                  />
                </div>
                <div className="foto-details">
                  <span className="foto-name">{fotoRemision.name}</span>
                  <button
                    type="button"
                    className="foto-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFotoRemision();
                    }}
                  >
                    🗑️ Cambiar
                  </button>
                </div>
              </div>
            ) : (
              <div className="foto-placeholder">
                <span className="upload-icon">{!fotoImplementacion ? '�' : '�📷'}</span>
                <span className="upload-text">
                  {!fotoImplementacion 
                    ? 'Deshabilitado - Sube primero la implementación' 
                    : 'Subir foto de la remisión'}
                </span>
                <span className="upload-hint">
                  {!fotoImplementacion 
                    ? 'Debes subir la foto de implementación primero' 
                    : 'Toca para seleccionar imagen'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fotos-resumen">
        <div className="resumen-stats">
          <div className="stat-item">
            <span className="stat-number">{fotoImplementacion ? 1 : 0}</span>
            <span className="stat-label">Foto implementación</span>
          </div>
          <div className="stat-divider">+</div>
          <div className="stat-item">
            <span className="stat-number">{fotoRemision ? 1 : 0}</span>
            <span className="stat-label">Foto remisión</span>
          </div>
          <div className="stat-divider">de</div>
          <div className="stat-item">
            <span className="stat-number">2</span>
            <span className="stat-label">Total requeridas</span>
          </div>
        </div>
        
        <div className="progreso-bar">
          <div 
            className="progreso-fill" 
            style={{
              width: `${((fotoImplementacion ? 1 : 0) + (fotoRemision ? 1 : 0)) / 2 * 100}%`
            }}
          ></div>
        </div>
        
        {(fotoImplementacion && fotoRemision) ? (
          <p className="status-message success">
            ✅ Todas las fotos han sido subidas correctamente
          </p>
        ) : (
          <p className="status-message pending">
            ⏳ Faltan {2 - ((fotoImplementacion ? 1 : 0) + (fotoRemision ? 1 : 0))} fotos por subir
          </p>
        )}
      </div>
    </div>
  );
};

export default RegistroFotograficoImplementacion;
