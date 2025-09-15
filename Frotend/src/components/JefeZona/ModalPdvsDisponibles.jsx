import React, { useState, useEffect } from 'react';
import { useJefeZona } from '../../hooks/jefe-zona/useJefeZona';
import '../../styles/JefeZona/modal-pdvs-disponibles.css';

/**
 * Modal que muestra todos los PDVs disponibles para el Jefe de Zona
 * Permite buscar y seleccionar un PDV para usar en el formulario
 */
export default function ModalPdvsDisponibles({ isOpen, onClose, onSelectPdv }) {
  const { obtenerPdvsAsignados, loading, error } = useJefeZona();
  const [pdvs, setPdvs] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [pdvsFiltrados, setPdvsFiltrados] = useState([]);

  // Cargar PDVs cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarPdvs();
      setFiltro(''); // Limpiar filtro al abrir
    }
  }, [isOpen]);

  // Filtrar PDVs cuando cambia el filtro
  useEffect(() => {
    if (!filtro.trim()) {
      setPdvsFiltrados(pdvs);
    } else {
      const filtroLower = filtro.toLowerCase();
      const filtrados = pdvs.filter(pdv => {
        // Convertir a string todos los valores antes de hacer toLowerCase
        const codigo = String(pdv.codigo || '').toLowerCase();
        const nombre = String(pdv.nombre || '').toLowerCase();
        const direccion = String(pdv.direccion || '').toLowerCase();
        const ciudad = String(pdv.ciudad || '').toLowerCase();
        const agente = String(pdv.agente_nombre || '').toLowerCase();
        
        return codigo.includes(filtroLower) ||
               nombre.includes(filtroLower) ||
               direccion.includes(filtroLower) ||
               ciudad.includes(filtroLower) ||
               agente.includes(filtroLower);
      });
      setPdvsFiltrados(filtrados);
    }
  }, [filtro, pdvs]);

  const cargarPdvs = async () => {
    try {
      const resultado = await obtenerPdvsAsignados();
      console.log('🔍 Debug - Resultado completo del backend:', resultado);
      if (resultado && resultado.pdvs) {
        console.log('🔍 Debug - PDVs individuales:', resultado.pdvs);
        console.log('🔍 Debug - Primer PDV ejemplo:', resultado.pdvs[0]);
        setPdvs(resultado.pdvs);
        setPdvsFiltrados(resultado.pdvs);
      }
    } catch (err) {
      console.error('Error cargando PDVs:', err);
    }
  };

  const handleSelectPdv = (pdv) => {
    onSelectPdv(pdv);
    onClose();
    setFiltro(''); // Limpiar filtro al seleccionar
  };

  // Cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-pdvs-container">
        <div className="modal-header">
          <h2>📍 Puntos de Venta Disponibles</h2>
          <button className="modal-close-btn" onClick={onClose} title="Cerrar modal">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Buscador */}
          <div className="pdv-search-container">
            <input
              type="text"
              placeholder="Buscar por código, nombre, dirección, ciudad o empresa..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pdv-search-input"
              autoFocus
            />
          </div>

          {/* Estado de carga */}
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>🔄 Cargando puntos de venta...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-container">
              <p>❌ Error: {error}</p>
              <button onClick={cargarPdvs} className="retry-btn">
                🔄 Reintentar
              </button>
            </div>
          )}

          {/* Contenido de PDVs */}
          {!loading && !error && (
            <div className="pdvs-content-container">
              <div className="pdvs-count">
                📊 Mostrando {pdvsFiltrados.length} de {pdvs.length} puntos de venta
                {filtro && ` (filtrado por: "${filtro}")`}
              </div>
              
              <div className="pdvs-cards-container">
                {pdvsFiltrados.length > 0 ? (
                  pdvsFiltrados.map((pdv) => (
                    <div key={pdv.id} className="pdv-card">
                      <div className="pdv-card-header">
                        <div className="pdv-codigo">
                          <span className="codigo-label">CÓDIGO:</span>
                          <span className="codigo-value">{pdv.codigo}</span>
                        </div>
                        <button
                          onClick={() => handleSelectPdv(pdv)}
                          className="select-pdv-btn"
                          title={`Seleccionar PDV ${pdv.codigo}`}
                        >
                          ✅ SELECCIONAR
                        </button>
                      </div>
                      
                      <div className="pdv-card-body">
                        <div className="pdv-field">
                          <span className="field-label">📍 Descripción:</span>
                          <span className="field-value">{pdv.nombre || 'Sin nombre'}</span>
                        </div>
                        
                        <div className="pdv-field">
                          <span className="field-label">🏠 Dirección:</span>
                          <span className="field-value">{pdv.direccion || 'Sin dirección'}</span>
                        </div>
                        
                        <div className="pdv-field">
                          <span className="field-label">🌆 Ciudad:</span>
                          <span className="field-value">{pdv.ciudad || 'Sin ciudad'}</span>
                        </div>
                        
                        <div className="pdv-field">
                          <span className="field-label">🏢 Empresa:</span>
                          <span className="field-value">{pdv.agente_nombre || 'Sin empresa'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-results-card">
                    {filtro ? 
                      `🔍 No se encontraron PDVs que coincidan con "${filtro}"` :
                      '📭 No hay puntos de venta disponibles'
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="modal-cancel-btn">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
