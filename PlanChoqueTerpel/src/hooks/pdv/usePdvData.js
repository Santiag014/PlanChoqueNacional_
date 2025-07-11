import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook personalizado para manejar los datos del PDV
 * @param {number} userId - ID del usuario
 * @returns {Object} Estados y funciones para los datos del PDV
 */
export const usePdvData = (userId) => {
  const [codigoPDV, setCodigoPDV] = useState('');
  const [correspondeA, setCorrespondeA] = useState('');
  const [puedeSeleccionarKPI, setPuedeSeleccionarKPI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para obtener datos del PDV desde el API
  const obtenerDatosPDV = async (codigo) => {
    if (!codigo || codigo.length < 3 || !userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/pdv-desc?codigo=${codigo}&user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCorrespondeA(data.descripcion || '');
          setPuedeSeleccionarKPI(true);
        } else {
          setCorrespondeA('N/A');
          setPuedeSeleccionarKPI(false);
          setError('PDV no encontrado');
        }
      } else {
        throw new Error(`Error HTTP: ${response.status}`);
      }
    } catch (err) {
      console.error('Error en obtenerDatosPDV:', err);
      setCorrespondeA('N/A');
      setPuedeSeleccionarKPI(false);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar cambios en el código PDV
  const handleCodigoPDVChange = (codigo) => {
    setCodigoPDV(codigo);
    if (codigo.length >= 3 && userId) {
      obtenerDatosPDV(codigo);
    } else {
      setCorrespondeA('');
      setPuedeSeleccionarKPI(false);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (userId && codigoPDV) {
      obtenerDatosPDV(codigoPDV);
    }
  }, [userId]);

  return {
    codigoPDV,
    correspondeA,
    puedeSeleccionarKPI,
    isLoading,
    error,
    setCodigoPDV: handleCodigoPDVChange,
    obtenerDatosPDV
  };
};

