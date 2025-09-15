import { useState } from 'react';
import { CONFIG } from '../../config.js';

export const useReportesUsuarios = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const descargarReporteUsuarios = async () => {
    setLoading(true);
    setError(null);

    // Crear overlay de carga
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner-big"></div>
      <div class="loading-text">
        <div>🔄 Generando reporte de usuarios...</div>
        <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Esto puede tomar unos momentos</div>
      </div>
    `;
    document.body.appendChild(overlay);

    try {
      // TEMPORAL: Sin token para testing
      const response = await fetch(`${CONFIG.API_BASE_URL}/ot/reportes-usuarios-excel`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        // Importante: no incluir Content-Type para descarga de archivos
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al descargar el reporte');
      }

      // Actualizar mensaje de carga
      overlay.querySelector('.loading-text').innerHTML = `
        <div>📊 Preparando descarga...</div>
        <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Archivo listo para descargar</div>
      `;

      // Obtener el blob del archivo Excel con tipo específico
      const blob = await response.blob();
      
      // Verificar que el blob no esté vacío
      if (blob.size === 0) {
        throw new Error('El archivo descargado está vacío');
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
      
      // Obtener nombre del archivo desde headers o usar nombre por defecto
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Reporte_Usuarios_Filtrado.xlsx';
      
      if (contentDisposition) {
        // Mejorar extracción del nombre de archivo para Unicode
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)|filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1] || filenameMatch[2]);
        }
      }
      
      link.download = filename;
      
      // Agregar al DOM temporalmente y hacer click
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Reporte descargado exitosamente' };

    } catch (err) {
      //console.error('Error descargando reporte de usuarios:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
      // Remover overlay después de un pequeño delay
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 500);
    }
  };

  return {
    descargarReporteUsuarios,
    loading,
    error
  };
};