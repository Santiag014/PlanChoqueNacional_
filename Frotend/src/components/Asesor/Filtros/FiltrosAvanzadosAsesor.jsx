import React, { useState, useEffect } from 'react';

/**
 * Componente de filtros avanzados para asesor
 * Permite filtrar por PDV y ciudad
 */
export default function FiltrosAvanzadosAsesor({ 
  pdvs = [], 
  filtros = {}, 
  onFiltrosChange, 
  className = '',
  esDirector = false,
  companiaFiltro = '',
  setCompaniaFiltro = () => {},
}) {
  const [filtrosLocal, setFiltrosLocal] = useState({
    pdv: '',
    ciudad: '',
    ...filtros
  });
  
  const [ciudadesDisponibles, setCiudadesDisponibles] = useState([]);

  // Actualizar filtros locales cuando cambien los filtros externos
  useEffect(() => {
    setFiltrosLocal(prev => ({ ...prev, ...filtros }));
  }, [filtros]);

  // Obtener ciudades únicas de los PDVs
  useEffect(() => {
    const ciudades = new Set();
    pdvs.forEach(pdv => {
      if (pdv.direccion) {
        // Extraer ciudad de la dirección (último elemento después de la coma)
        const partes = pdv.direccion.split(',');
        if (partes.length > 1) {
          const ciudad = partes[partes.length - 1].trim();
          ciudades.add(ciudad);
        }
      }
    });
    setCiudadesDisponibles(Array.from(ciudades).sort());
  }, [pdvs]);

  // Manejar cambio en los filtros
  const handleFiltroChange = (tipo, valor) => {
    const nuevosFiltros = { ...filtrosLocal };
    
    if (tipo === 'pdv') {
      nuevosFiltros.pdv = valor;
      // Si se selecciona un PDV, también filtrar por ciudad automáticamente
      if (valor) {
        const pdvSeleccionado = pdvs.find(p => p.nombre === valor);
        if (pdvSeleccionado && pdvSeleccionado.direccion) {
          const partes = pdvSeleccionado.direccion.split(',');
          if (partes.length > 1) {
            nuevosFiltros.ciudad = partes[partes.length - 1].trim();
          }
        }
      }
    } else if (tipo === 'ciudad') {
      nuevosFiltros.ciudad = valor;
    }

    setFiltrosLocal(nuevosFiltros);
    if (onFiltrosChange) {
      onFiltrosChange(nuevosFiltros);
    }
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    const filtrosVacios = { pdv: '', ciudad: '' };
    setFiltrosLocal(filtrosVacios);
    if (onFiltrosChange) {
      onFiltrosChange(filtrosVacios);
    }
  };

  return (
    <div className={`filtros-avanzados-asesor ${className}`} style={{
      background: '#fff',
      borderRadius: 12,
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 600,
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M9 12h12M3 18h18" stroke="#e30613" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Filtros
        </h3>
        
        <button
          onClick={limpiarFiltros}
          style={{
            background: 'transparent',
            border: '1px solid #e30613',
            borderRadius: 6,
            color: '#e30613',
            fontSize: '12px',
            fontWeight: 600,
            padding: '6px 12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#e30613';
            e.target.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#e30613';
          }}
        >
          Limpiar Todo
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {/* Filtro por PDV */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '4px'
          }}>
            Punto de Venta
          </label>
          <select
            value={filtrosLocal.pdv}
            onChange={(e) => handleFiltroChange('pdv', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: '14px',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="">Todos los PDVs</option>
            {pdvs.map(pdv => (
              <option key={pdv.id} value={pdv.nombre}>
                {pdv.nombre} ({pdv.codigo})
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por compañía solo visible para director */}
        {esDirector && (
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '4px'
            }}>
              Compañía
            </label>
            <select
              value={companiaFiltro}
              onChange={e => setCompaniaFiltro(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: '14px',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="">Todas las compañías</option>
              <option value="Ludelpa">Ludelpa</option>
              <option value="RyR">RyR</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
