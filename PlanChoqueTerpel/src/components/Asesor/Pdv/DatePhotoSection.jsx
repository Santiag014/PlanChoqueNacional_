import React from 'react';

/**
 * Componente para campos de fecha y foto
 */
const DatePhotoSection = ({ fecha, setFecha, foto, setFoto, idPrefix = 'default' }) => {
  const handleFoto = e => setFoto(e.target.files[0]);
  
  // IDs únicos usando el prefijo
  const fechaInputId = `fecha-input-${idPrefix}`;
  const fotoInputId = `foto-input-${idPrefix}`;

  return (
    <>
      {/* Fecha */}
      <div className="pdv-row-fecha">
        <label className="pdv-label" htmlFor={fechaInputId}>FECHA</label>
        <div className="relative flex-1">
          <input
            id={fechaInputId}
            className="pdv-input-date ta-center"
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
          />
          <span className="date-icon cursor-pointer">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="#fff" strokeWidth="2"/>
              <rect x="7" y="2" width="2" height="4" rx="1" fill="#fff"/>
              <rect x="15" y="2" width="2" height="4" rx="1" fill="#fff"/>
              <rect x="3" y="9" width="18" height="2" fill="#fff"/>
            </svg>
          </span>
        </div>
      </div>

      {/* Foto */}
      <div className="pdv-row-foto">
        <label className="pdv-label" htmlFor={fotoInputId}>ADJUNTAR FOTO</label>
        <div className="adjuntar-foto-box">
          <input
            type="file"
            accept="image/*"
            id={fotoInputId}
            className="display-none"
            onChange={handleFoto}
          />
          <div
            className="adjuntar-foto-input cursor-pointer"
            tabIndex={0}
            onClick={() => document.getElementById(fotoInputId).click()}
          >
            <span className="foto-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="3" fill="#e30613" stroke="#fff" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="3" fill="#fff"/>
                <rect x="7" y="2" width="2" height="4" rx="1" fill="#fff"/>
              </svg>
            </span>
            <span className="adjuntar-foto-placeholder">
              {foto ? foto.name : "Seleccionar foto"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default DatePhotoSection;
