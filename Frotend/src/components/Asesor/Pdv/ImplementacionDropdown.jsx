import React, { useState } from 'react';
import { useImplementacionInfo } from '../../../hooks/asesor';

/**
 * Componente dropdown para seleccionar implementaciones
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.implementaciones - Lista de implementaciones disponibles
 * @param {Object} props.implementacionSeleccionada - Implementación actualmente seleccionada
 * @param {Function} props.onSelect - Función a ejecutar cuando se seleccione una implementación
 * @param {boolean} props.disabled - Si el dropdown está deshabilitado
 */
const ImplementacionDropdown = ({ 
  implementaciones = [], 
  implementacionSeleccionada, 
  onSelect, 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getProductosPorImplementacion } = useImplementacionInfo();

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (implementacion) => {
    if (implementacion.habilitada) {
      onSelect(implementacion);
      setIsOpen(false);
    }
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.implementacion-dropdown')) {
      setIsOpen(false);
    }
  };

  // Efecto para cerrar el dropdown cuando se hace clic fuera
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const productosInfo = implementacionSeleccionada 
    ? getProductosPorImplementacion(implementacionSeleccionada.numero)
    : null;

  return (
    <div className="implementacion-dropdown-container">
      
      <div className="implementacion-dropdown">
        <div 
          className={`implementacion-dropdown-header ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={handleToggle}
        >
          <div className="implementacion-dropdown-content">
            {implementacionSeleccionada ? (
              <div className="implementacion-dropdown-selected">
                <div className={`implementacion-dropdown-numero ${!implementacionSeleccionada.habilitada ? 'disabled' : ''}`}>
                  {implementacionSeleccionada.numero}
                </div>
                <div className="implementacion-dropdown-text">
                  <div className="implementacion-dropdown-title">
                    Implementación {implementacionSeleccionada.numero}
                  </div>
                  <div className="implementacion-dropdown-subtitle">
                    Meta: {implementacionSeleccionada.meta} galones
                    {productosInfo && ` • ${productosInfo.categoria}`}
                    {implementacionSeleccionada.completada && ' • Completada'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="implementacion-dropdown-placeholder">
                {implementaciones.length > 0 
                  ? 'Selecciona una implementación...' 
                  : 'No hay implementaciones disponibles'
                }
              </div>
            )}
          </div>
          
          {!disabled && implementaciones.length > 0 && (
            <div className={`implementacion-dropdown-arrow ${isOpen ? 'open' : ''}`}>
              ▼
            </div>
          )}
        </div>

        {isOpen && !disabled && (
          <div className="implementacion-dropdown-list">
            {implementaciones.map((impl) => (
              <div
                key={impl.numero}
                className={`implementacion-dropdown-item ${
                  impl.habilitada ? '' : 'disabled'
                } ${
                  implementacionSeleccionada?.numero === impl.numero ? 'selected' : ''
                }`}
                onClick={() => handleSelect(impl)}
              >
                <div className={`implementacion-dropdown-numero ${!impl.habilitada ? 'disabled' : ''}`}>
                  {impl.numero}
                </div>
                <div className="implementacion-dropdown-text">
                  <div className="implementacion-dropdown-title">
                    Implementación {impl.numero}
                  </div>
                  <div className="implementacion-dropdown-subtitle">
                    Meta: {impl.meta} galones
                    {getProductosPorImplementacion(impl.numero) && 
                      ` • ${getProductosPorImplementacion(impl.numero).categoria}`
                    }
                    {impl.completada && ' • Completada'}
                  </div>
                </div>
                <div className={`implementacion-item-status ${
                  impl.completada ? 'completed' : 
                  impl.habilitada ? 'available' : 'unavailable'
                }`}>
                  {impl.completada ? '✓ Implementada' : 
                   impl.habilitada ? '✓ Disponible' : 
                   impl.estatus || '✗ No disponible'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ImplementacionDropdown;
