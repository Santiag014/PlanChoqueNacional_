import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_URL } from '../../../config.js';
import '../../../styles/Asesor/asesor-popup-info-pdv.css';

/**
 * Componente para mostrar un pop-up con los PDV asignados al asesor
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Indica si el pop-up está abierto
 * @param {function} props.onClose - Función para cerrar el pop-up
 * @param {number} props.userId - ID del usuario
 * @param {function} props.onSelectPdv - Función callback cuando se selecciona un PDV
 */
const PdvInfoPopup = ({ isOpen, onClose, userId, onSelectPdv }) => {
  const [pdvList, setPdvList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar PDV asignados al usuario cuando se abre el popup
  useEffect(() => {
    if (isOpen && userId) {
      cargarPdvAsignados();
    }
  }, [isOpen, userId]);

  // Efecto para manejar el scroll del body cuando el popup está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('popup-open');
    } else {
      document.body.classList.remove('popup-open');
    }
    
    // Cleanup al desmontar el componente
    return () => {
      document.body.classList.remove('popup-open');
    };
  }, [isOpen]);

  const cargarPdvAsignados = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/pdv-info?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPdvList(data.data || []);
        } else {
          setError('Error al cargar PDV asignados');
        }
      } else {
        throw new Error(`Error HTTP: ${response.status}`);
      }
    } catch (err) {
      console.error('Error cargando PDV:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPdv = (pdv) => {
    if (onSelectPdv) {
      onSelectPdv(pdv);
    }
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="pdv-popup-overlay" onClick={handleBackdropClick}>
      <div className="pdv-popup-container">
        <div className="pdv-popup-header">
          <h2>PDV Asignados</h2>
          <button className="pdv-popup-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="pdv-popup-content">
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px' 
            }}>
              <div className="spinner-red small" />
            </div>
          ) : error ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px',
              color: '#dc3545'
            }}>
              {error}
            </div>
          ) : pdvList.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px',
              color: '#666'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏪</div>
              <p>No tienes PDV asignados</p>
            </div>
          ) : (
            <div className="pdv-table-container">
              <table className="pdv-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th>Dirección</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pdvList.map((pdv) => (
                    <tr key={pdv.id}>
                      <td>{pdv.codigo}</td>
                      <td>{pdv.descripcion}</td>
                      <td>{pdv.direccion}</td>
                      <td>
                        <button 
                          className="btn-select-pdv"
                          onClick={() => handleSelectPdv(pdv)}
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PdvInfoPopup;
