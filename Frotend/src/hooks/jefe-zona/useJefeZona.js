import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook personalizado para manejar las funcionalidades del Jefe de Zona
 */
export function useJefeZona() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [esJefeZona, setEsJefeZona] = useState(false);
  const [empresasAsignadas, setEmpresasAsignadas] = useState([]);
  const [pdvsDisponibles, setPdvsDisponibles] = useState([]);

  // Verificar si el usuario es Jefe de Zona
  const verificarJefeZona = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar el mismo patrón de token que otros hooks del sistema
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
      
      // Verificar si hay token
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`${API_URL}/api/ot/jefe-zona/verificar-jefe-zona`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Verificar si la respuesta HTTP es exitosa
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token inválido o expirado. Por favor, vuelve a iniciar sesión.');
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para acceder a esta funcionalidad.');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const result = await response.json();
      
      if (result.success) {
        setEsJefeZona(result.data.esJefeZona);
        setEmpresasAsignadas(result.data.empresasAsignadas);
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error verificando Jefe de Zona:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Obtener PDVs asignados
  const obtenerPdvsAsignados = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar el mismo patrón de token que otros hooks del sistema
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
      const response = await fetch(`${API_URL}/api/ot/jefe-zona/pdvs-asignados`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setPdvsDisponibles(result.data.pdvs);
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error obteniendo PDVs:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    esJefeZona,
    empresasAsignadas,
    pdvsDisponibles,
    verificarJefeZona,
    obtenerPdvsAsignados
  };
}

/**
 * Hook para manejar la información de PDV específico
 */
export function usePdvJefeZona() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [codigoPDV, setCodigoPDV] = useState('');
  const [pdvInfo, setPdvInfo] = useState(null);

  // Buscar información del PDV por código
  const buscarPdvPorCodigo = async (codigo) => {
    if (!codigo.trim()) {
      setPdvInfo(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Usar el mismo patrón de token que otros hooks del sistema
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
      const response = await fetch(`${API_URL}/api/ot/jefe-zona/pdv-info/${codigo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setPdvInfo(result.data);
        return result.data;
      } else {
        setPdvInfo(null);
        setError(result.message);
        return null;
      }
    } catch (err) {
      setPdvInfo(null);
      setError(err.message);
      console.error('Error buscando PDV:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función para establecer código y buscar automáticamente
  const setCodigoYBuscar = (codigo) => {
    // Convertir a string para evitar errores
    const codigoStr = String(codigo || '');
    setCodigoPDV(codigoStr);
    
    if (codigoStr.trim()) {
      buscarPdvPorCodigo(codigoStr);
    } else {
      setPdvInfo(null);
      setError(null);
    }
  };

  return {
    loading,
    error,
    codigoPDV,
    pdvInfo,
    setCodigoPDV,
    setCodigoYBuscar,
    buscarPdvPorCodigo
  };
}

/**
 * Hook para manejar el registro de visitas del Jefe de Zona
 */
export function useRegistroVisitaJefeZona() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Registrar visita
  const registrarVisita = async (formData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Usar el mismo patrón de token que otros hooks del sistema
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
      
      // Agregar el user_id al FormData
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        formData.append('user_id', user.id);
      }
      
      const response = await fetch(`${API_URL}/api/cargar_registros_visitas_jfz`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error registrando visita:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Limpiar estados
  const limpiarEstados = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    loading,
    error,
    success,
    registrarVisita,
    limpiarEstados
  };
}

/**
 * Hook para manejar el historial de visitas del Jefe de Zona
 */
export function useHistorialVisitasJefeZona() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visitas, setVisitas] = useState([]);

  // Obtener historial de visitas
  const obtenerHistorial = async (filtros = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar el mismo patrón de token que otros hooks del sistema
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || 'legacy_auth';
      const queryParams = new URLSearchParams();
      
      if (filtros.fecha_inicio) queryParams.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) queryParams.append('fecha_fin', filtros.fecha_fin);
      if (filtros.codigo_pdv) queryParams.append('codigo_pdv', filtros.codigo_pdv);

      const url = `${API_URL}/api/ot/jefe-zona/historial-visitas${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setVisitas(result.data);
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error obteniendo historial:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    visitas,
    obtenerHistorial
  };
}
