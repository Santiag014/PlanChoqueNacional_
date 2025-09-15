import { useState } from 'react';
import { CONFIG } from '../../config';

export const useImplementaciones = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const descargarReporteImplementaciones = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // console.log('🚀 Iniciando descarga de reporte de implementaciones...');
      // console.log('🔗 API URL:', CONFIG.API_URL);
      
      // Obtener el token de autenticación - usar el mismo patrón que otros hooks
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      console.log('🔑 Token found:', token ? 'Sí' : 'No');
      
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicie sesión nuevamente.');
      }
      
      // Petición al endpoint - solo headers esenciales para evitar CORS
      const response = await fetch(`${CONFIG.API_URL}/api/ot/implementaciones/excel`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Authorization': `Bearer ${token}`
        }
      });

      // console.log('📊 Response status:', response.status);
      // console.log('📊 Response headers:', [...response.headers.entries()]);

      if (!response.ok) {
          // console.error('Response status:', response.status);
          // console.error('Response statusText:', response.statusText);
        
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          //console.error('No se pudo parsear la respuesta de error como JSON:', parseError);
          // Si no es JSON, intentar obtener el texto
          try {
            const errorText = await response.text();
            // console.error('Respuesta de error (texto):', errorText);
            if (errorText) {
              errorMessage = `${errorMessage} - ${errorText}`;
            }
          } catch (textError) {
            // console.error('No se pudo obtener el texto de la respuesta:', textError);
          }
        }
        
        throw new Error(errorMessage);
      }

      // Mostrar notificación de progreso
      const loadingToast = window.toast?.loading('📊 Preparando descarga...');

      // Obtener el blob del archivo Excel
      const blob = await response.blob();

      // console.log('📁 Blob size:', blob.size);
      // console.log('📁 Blob type:', blob.type);

      if (!blob || blob.size === 0) {
        throw new Error('El archivo descargado está vacío. Verifique que el servidor esté enviando datos.');
      }

      // Crear un blob específicamente tipado para Excel
      const excelBlob = new Blob([blob], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // Crear URL para descarga
      const url = window.URL.createObjectURL(excelBlob);

      // Crear elemento temporal para descarga
      const link = document.createElement('a');
      link.href = url;
      
      // Obtener filename del header o usar uno por defecto
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Reporte_Implementaciones.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar URL creada
      window.URL.revokeObjectURL(url);

      // Cerrar toast de loading y mostrar éxito
      if (loadingToast) window.toast?.dismiss(loadingToast);
      window.toast?.success('✅ Reporte de implementaciones descargado exitosamente');

      return { success: true, message: 'Reporte de implementaciones descargado exitosamente' };
      
    } catch (err) {
      //console.error('Error descargando reporte de implementaciones:', err);
      setError(err.message || 'Error al descargar el reporte');
      
      window.toast?.error(`❌ Error: ${err.message || 'No se pudo descargar el reporte'}`);
      
      return { 
        success: false, 
        message: err.message || 'Error al descargar el reporte de implementaciones' 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    descargarReporteImplementaciones,
    loading,
    error
  };
};
