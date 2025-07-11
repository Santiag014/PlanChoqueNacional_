import React, { useState, useEffect } from 'react';
import { useAsesorRoute } from '../../hooks/auth';
import { useResponsive } from '../../hooks/shared';
import { useAuthContext } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import RegistrosTable from '../../components/Asesor/HistorialRegistros/RegistrosTable';
import RegistroModal from '../../components/Asesor/HistorialRegistros/RegistroModal';
import FilterButtons from '../../components/Asesor/HistorialRegistros/FilterButtons';
import '../../styles/Asesor/asesor-historial-registros.css';

export default function HistorialRegistros() {
  // TODOS LOS HOOKS DEBEN IR AQUÍ PRIMERO - ANTES DE CUALQUIER RETORNO CONDICIONAL
  
  // Proteger la ruta
  const { user, loading: authLoading, isAuthenticated, hasRequiredRole } = useAsesorRoute();
  const { isMobile } = useResponsive();
  const { authenticatedFetch } = useAuthContext();

  // Estados
  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroKPI, setFiltroKPI] = useState('TODOS');
  const [filtroActividad, setFiltroActividad] = useState('TODAS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [busquedaCodigo, setBusquedaCodigo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [loadingDetalles, setLoadingDetalles] = useState(false);

  // Cargar registros
  useEffect(() => {
    const cargarRegistros = async () => {
      // Verificar que tenemos usuario y token antes de hacer la petición
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null); // Limpiar errores anteriores
        
        // Intentar con authenticatedFetch primero
        let response;
        try {
          if (!authenticatedFetch) {
            throw new Error('authenticatedFetch no está disponible');
          }
          response = await authenticatedFetch(`/api/asesor/historial-registros/${user.id}`);
        } catch (authError) {
          // Fallback: usar fetch manual con token de localStorage
          const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
          if (!token) {
            throw new Error('No se encontró token de autenticación');
          }
          
          const fullUrl = `/api/asesor/historial-registros/${user.id}`.startsWith('http') 
            ? `/api/asesor/historial-registros/${user.id}` 
            : `${window.location.origin}/api/asesor/historial-registros/${user.id}`;
          
          response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (!response) {
          throw new Error('No se pudo realizar la petición');
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          const registrosData = data.data || [];
          setRegistros(registrosData);
          setRegistrosFiltrados(registrosData);
          setError(null);
        } else {
          throw new Error(data.message || 'Error al cargar los registros');
        }
      } catch (err) {
        setError(`Error al cargar registros: ${err.message}`);
        
        // Solo usar datos mock en desarrollo y si no hay registros reales
        if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
          // console.log('Usando datos mock para desarrollo');
          const registrosMock = [
            // 3 registros de FRECUENCIA
            {
              id: 1,
              codigo_pdv: '001',
              nombre_agente: 'Carlos Rodríguez',
              fecha_registro: new Date(Date.now() - 86400000).toISOString(), // 1 día atrás
              tipo_kpi: 'FRECUENCIA',
              nombre_pdv: 'Estación Central',
              estado: 'VALIDADO',
              observaciones: 'Implementación exitosa de frecuencia de visitas'
            },
            {
              id: 2,
              codigo_pdv: '003',
              nombre_agente: 'Ana Martínez',
              fecha_registro: new Date(Date.now() - 172800000).toISOString(), // 2 días atrás
              tipo_kpi: 'FRECUENCIA',
              nombre_pdv: 'Estación Norte',
              estado: 'PENDIENTE',
              observaciones: 'Pendiente validación de visitas programadas'
            },
            {
              id: 3,
              codigo_pdv: '007',
              nombre_agente: 'Roberto Silva',
              fecha_registro: new Date(Date.now() - 259200000).toISOString(), // 3 días atrás
              tipo_kpi: 'FRECUENCIA',
              nombre_pdv: 'Estación Express',
              estado: 'RECHAZADO',
              observaciones: 'No cumple con la frecuencia mínima requerida'
            },
            
            // 3 registros de PRECIO/VOLUMEN
            {
              id: 4,
              codigo_pdv: '002',
              nombre_agente: 'Laura González',
              fecha_registro: new Date(Date.now() - 345600000).toISOString(), // 4 días atrás
              tipo_kpi: 'PRECIO_VOLUMEN',
              nombre_pdv: 'Estación Sur',
              estado: 'VALIDADO',
              observaciones: 'Excelente implementación de precios y volumen'
            },
            {
              id: 5,
              codigo_pdv: '009',
              nombre_agente: 'Miguel Torres',
              fecha_registro: new Date(Date.now() - 432000000).toISOString(), // 5 días atrás
              tipo_kpi: 'PRECIO_VOLUMEN',
              nombre_pdv: 'Estación Plaza',
              estado: 'VALIDADO',
              observaciones: 'Cumple objetivos de precio y volumen'
            },
            {
              id: 6,
              codigo_pdv: '012',
              nombre_agente: 'Patricia Ruiz',
              fecha_registro: new Date(Date.now() - 518400000).toISOString(), // 6 días atrás
              tipo_kpi: 'PRECIO_VOLUMEN',
              nombre_pdv: 'Estación Oriente',
              estado: 'PENDIENTE',
              observaciones: 'Revisión de precios en curso'
            },
            
            // 4 registros de VOLUMEN solo
            {
              id: 7,
              codigo_pdv: '004',
              nombre_agente: 'Diego Herrera',
              fecha_registro: new Date(Date.now() - 604800000).toISOString(), // 7 días atrás
              tipo_kpi: 'VOLUMEN',
              nombre_pdv: 'Estación Occidente',
              estado: 'VALIDADO',
              observaciones: 'Excelente volumen de ventas logrado'
            },
            {
              id: 8,
              codigo_pdv: '006',
              nombre_agente: 'Sofía Mendoza',
              fecha_registro: new Date(Date.now() - 691200000).toISOString(), // 8 días atrás
              tipo_kpi: 'VOLUMEN',
              nombre_pdv: 'Estación Zona Rosa',
              estado: 'VALIDADO',
              observaciones: 'Superó meta de volumen mensual'
            },
            {
              id: 9,
              codigo_pdv: '011',
              nombre_agente: 'Alejandro Castro',
              fecha_registro: new Date(Date.now() - 777600000).toISOString(), // 9 días atrás
              tipo_kpi: 'VOLUMEN',
              nombre_pdv: 'Estación Industrial',
              estado: 'PENDIENTE',
              observaciones: 'Evaluando incremento de volumen'
            },
            {
              id: 10,
              codigo_pdv: '015',
              nombre_agente: 'Valeria López',
              fecha_registro: new Date(Date.now() - 864000000).toISOString(), // 10 días atrás
              tipo_kpi: 'VOLUMEN',
              nombre_pdv: 'Estación Centro',
              estado: 'RECHAZADO',
              observaciones: 'No alcanzó el volumen mínimo requerido'
            },
            
            // 1 registro de PRECIO solo
            {
              id: 11,
              codigo_pdv: '008',
              nombre_agente: 'Fernando Jiménez',
              fecha_registro: new Date(Date.now() - 950400000).toISOString(), // 11 días atrás
              tipo_kpi: 'PRECIO',
              nombre_pdv: 'Estación Aeropuerto',
              estado: 'VALIDADO',
              observaciones: 'Implementación correcta de precios competitivos'
            }
          ];
          
          setRegistros(registrosMock);
          setRegistrosFiltrados(registrosMock);
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    };

    // Solo cargar si tenemos usuario y no estamos en loading de auth
    if (user?.id && !authLoading && isAuthenticated && hasRequiredRole) {
      cargarRegistros();
    }
  }, [user?.id, authenticatedFetch, authLoading, isAuthenticated, hasRequiredRole]);

  // Filtrar registros
  useEffect(() => {
    let filtrados = registros;

    // Filtro por KPI
    if (filtroKPI !== 'TODOS') {
      filtrados = filtrados.filter(registro => {
        const tipoKpi = registro.tipo_kpi?.toUpperCase();
        
        // Para PRECIO_VOLUMEN, mostrar tanto en filtro PRECIO como VOLUMEN
        if (tipoKpi === 'PRECIO_VOLUMEN') {
          return filtroKPI === 'PRECIO' || filtroKPI === 'VOLUMEN' || filtroKPI === 'PRECIO_VOLUMEN';
        }
        
        return tipoKpi === filtroKPI;
      });
    }

    // Filtro por Actividad
    if (filtroActividad !== 'TODAS') {
      filtrados = filtrados.filter(registro => {
        const tipoKpi = registro.tipo_kpi?.toUpperCase();
        let actividad = '';
        
        switch (tipoKpi) {
          case 'VOLUMEN':
          case 'PRECIO': 
          case 'PRECIO_VOLUMEN':
          case 'PROFUNDIDAD':
            actividad = 'IMPLEMENTACION';
            break;
          case 'FRECUENCIA':
          case 'COBERTURA':
            actividad = 'VISITA';
            break;
          default:
            actividad = 'VISITA';
        }
        
        return actividad === filtroActividad;
      });
    }

    // Filtro por Estado
    if (filtroEstado !== 'TODOS') {
      filtrados = filtrados.filter(registro => 
        registro.estado?.toUpperCase() === filtroEstado
      );
    }

    // Filtro por código PDV
    if (busquedaCodigo.trim()) {
      filtrados = filtrados.filter(registro =>
        registro.codigo_pdv?.toString().includes(busquedaCodigo.trim())
      );
    }

    setRegistrosFiltrados(filtrados);
  }, [registros, filtroKPI, filtroActividad, filtroEstado, busquedaCodigo]);

  // Abrir modal con detalles
  const handleVerDetalles = async (registro) => {
    try {
      setRegistroSeleccionado(registro);
      setModalOpen(true);
      setLoadingDetalles(true);

      // Verificar que tenemos registro válido
      if (!registro?.id) {
        throw new Error('Registro inválido');
      }

      // console.log('Cargando detalles para registro:', registro.id);

      // Intentar con authenticatedFetch primero
      let response;
      try {
        if (!authenticatedFetch) {
          throw new Error('authenticatedFetch no está disponible');
        }
        response = await authenticatedFetch(`/api/asesor/registro-detalles/${registro.id}`);
      } catch (authError) {
        // console.warn('Error con authenticatedFetch en detalles, intentando fetch manual:', authError);
        
        // Fallback: usar fetch manual
        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }
        
        const fullUrl = `/api/asesor/registro-detalles/${registro.id}`.startsWith('http') 
          ? `/api/asesor/registro-detalles/${registro.id}` 
          : `${window.location.origin}/api/asesor/registro-detalles/${registro.id}`;
        
        response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (!response) {
        throw new Error('No se pudo realizar la petición de detalles');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        // console.error('Error HTTP en detalles:', response.status, errorText);
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      // console.log('Detalles recibidos:', data);
      
      if (data.success) {
        setRegistroSeleccionado({
          ...registro,
          detalles: data.data
        });
      } else {
        throw new Error(data.message || 'Error al cargar detalles');
      }
    } catch (err) {
      // console.error('Error cargando detalles:', err);
      // Datos mock en caso de error solo en desarrollo
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        // console.log('Usando detalles mock para desarrollo');
        
        // Generar detalles específicos según el tipo de KPI y el ID del registro
        let detallesMock = {
          foto: `/storage/2025-07-10/ejemplo-registro-${registro.id}.png`
        };

        switch (registro.tipo_kpi) {
          case 'FRECUENCIA':
            detallesMock.visitas = [
              {
                fecha: new Date(Date.now() - 86400000).toISOString(),
                hora: '09:30',
                duracion: '45 min',
                actividades: ['Verificación de productos', 'Capacitación al personal', 'Actualización de precios']
              },
              {
                fecha: new Date(Date.now() - 172800000).toISOString(),
                hora: '14:15',
                duracion: '30 min',
                actividades: ['Revisión de inventario', 'Asesoría comercial']
              }
            ];
            detallesMock.frecuencia_programada = 'Semanal';
            detallesMock.frecuencia_real = '2 visitas/semana';
            detallesMock.cumplimiento = registro.estado === 'VALIDADO' ? '100%' : '75%';
            break;

          case 'PRECIO':
          case 'PRECIO_VOLUMEN':
            detallesMock.productos = [
              {
                referencia: 'TERPEL OILTEC 10W-30 TITANIO',
                presentacion: '1L',
                precio_sugerido: 28000,
                precio_implementado: registro.tipo_kpi === 'PRECIO_VOLUMEN' ? 27500 : 28200,
                cajas: registro.tipo_kpi === 'PRECIO_VOLUMEN' ? 12 : undefined,
                galones: registro.tipo_kpi === 'PRECIO_VOLUMEN' ? 150 : undefined
              },
              {
                referencia: 'TERPEL CELERITY 4T 20W-50 TITANIO',
                presentacion: '4L',
                precio_sugerido: 95000,
                precio_implementado: registro.tipo_kpi === 'PRECIO_VOLUMEN' ? 94000 : 96000,
                cajas: registro.tipo_kpi === 'PRECIO_VOLUMEN' ? 5 : undefined,
                galones: registro.tipo_kpi === 'PRECIO_VOLUMEN' ? 85 : undefined
              },
              {
                referencia: 'REFRIGERANTE LARGA VIDA',
                presentacion: '1L',
                precio_sugerido: 18000,
                precio_implementado: registro.tipo_kpi === 'PRECIO_VOLUMEN' ? 17800 : 18500,
                cajas: registro.tipo_kpi === 'PRECIO_VOLUMEN' ? 15 : undefined,
                galones: registro.tipo_kpi === 'PRECIO_VOLUMEN' ? 200 : undefined
              }
            ];
            break;

          case 'VOLUMEN':
            detallesMock.productos = [
              {
                referencia: 'TERPEL OILTEC 10W-40 TITANIO',
                presentacion: '1L',
                cajas: 18,
                galones: 180
              },
              {
                referencia: 'TERPEL CELERITY 2T BIO ANTIHUMO',
                presentacion: '500ml',
                cajas: 10,
                galones: 95
              },
              {
                referencia: 'REFRIGERANTE ESTÁNDAR',
                presentacion: '1L',
                cajas: 22,
                galones: 220
              }
            ];
            break;

          default:
            detallesMock.productos = [
              {
                referencia: 'Producto de ejemplo',
                presentacion: '1L',
                precio: 25000,
                volumen: 1
              }
            ];
        }

        // Agregar información del PDV y validaciones
        detallesMock.pdv_info = {
          direccion: `Calle ${registro.codigo_pdv} # ${10 + parseInt(registro.id)}-${20 + parseInt(registro.id)}`,
          ciudad: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'][registro.id % 4],
          telefono: `300${registro.codigo_pdv}${registro.id}890`,
          gerente: ['Ana García', 'Carlos Pérez', 'Luis Martín', 'Sandra López'][registro.id % 4]
        };

        // Estados generales
        detallesMock.estado_general = registro.estado === 'VALIDADO' ? 'APROBADO' : 
                                      registro.estado === 'RECHAZADO' ? 'RECHAZADO' : 'PENDIENTE';
        
        // Estado Mystery Shopper solo para KPIs de precio
        if (registro.tipo_kpi === 'PRECIO' || registro.tipo_kpi === 'PRECIO_VOLUMEN') {
          detallesMock.estado_mystery_shopper = ['APROBADO', 'PENDIENTE', 'RECHAZADO'][registro.id % 3];
        }

        // Fotos específicas según KPI
        detallesMock.foto_pop = '/storage/img_productos_carrusel/TERPEL OILTEC 10W-30 TITANIO.png';
        detallesMock.foto_factura = '/storage/img_productos_carrusel/REFRIGERANTE LARGA VIDA.png';
        detallesMock.foto_evidencia = '/storage/img_productos_carrusel/TERPEL CELERITY 4T 20W-50 TITANIO.png';
        detallesMock.foto = '/storage/img_productos_carrusel/img_login.png';

        // Para volumen, agregar múltiples fotos de evidencia
        if (registro.tipo_kpi === 'VOLUMEN') {
          detallesMock.fotos_factura = [
            '/storage/img_productos_carrusel/REFRIGERANTE LARGA VIDA.png',
            '/storage/img_productos_carrusel/TERPEL CELERITY 4T 20W-50 TITANIO.png',
            '/storage/img_productos_carrusel/TERPEL OILTEC 10W-40 TITANIO.png'
          ];
        }

        setRegistroSeleccionado({
          ...registro,
          detalles: detallesMock
        });
      } else {
        // En producción, mostrar error
        setError(`Error al cargar detalles: ${err.message}`);
        setModalOpen(false);
      }
    } finally {
      setLoadingDetalles(false);
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroKPI('TODOS');
    setFiltroActividad('TODAS');
    setFiltroEstado('TODOS');
    setBusquedaCodigo('');
  };

  // AHORA SÍ PODEMOS HACER LOS RETORNOS CONDICIONALES DESPUÉS DE TODOS LOS HOOKS

  // Loading de autenticación
  if (authLoading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  // Verificar autorización
  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout user={user} pageTitle="HISTORIAL DE REGISTROS">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando historial de registros...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} pageTitle="HISTORIAL DE REGISTROS">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Reintentar
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} pageTitle="HISTORIAL DE REGISTROS">
      <div className="historial-registros">

        {/* Filtros */}
        <div className="filtros-container">
          {/* Búsqueda por código */}
          <div className="busqueda-container">
            <input
              type="text"
              placeholder="Filtrar por código PDV"
              value={busquedaCodigo}
              onChange={(e) => setBusquedaCodigo(e.target.value)}
              className="busqueda-input"
            />
            <button onClick={limpiarFiltros} className="limpiar-btn">
              Limpiar
            </button>
          </div>

          {/* Filtros por KPI, Actividad y Estado */}
          <FilterButtons 
            filtroKPI={filtroKPI}
            filtroActividad={filtroActividad}
            filtroEstado={filtroEstado}
            onFiltroKPIChange={setFiltroKPI}
            onFiltroActividadChange={setFiltroActividad}
            onFiltroEstadoChange={setFiltroEstado}
            isMobile={isMobile}
          />

          {/* Contador de registros simple */}
          <div className="contador-simple">
            Total de registros: {registrosFiltrados.length}
          </div>
        </div>

        {/* Tabla de registros */}
        <RegistrosTable
          registros={registrosFiltrados}
          onVerDetalles={handleVerDetalles}
          isMobile={isMobile}
        />

        {/* Modal de detalles */}
        {modalOpen && (
          <RegistroModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            registro={registroSeleccionado}
            loading={loadingDetalles}
            isMobile={isMobile}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
