import { useState } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook personalizado para manejar el envío de reportes
 * @param {number} userId - ID del usuario
 * @returns {Object} Estados y funciones para el envío de reportes
 */
export const useReportSubmission = (userId) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Función para construir el reporte final
  const construirReporteFinal = (codigoPDV, correspondeA, kpiSeleccionado, fecha, foto, acumulados) => {
    return {
      user_id: userId,
      codigo_pdv: codigoPDV,
      nombre_pdv: correspondeA,
      kpi_tipo: kpiSeleccionado,
      fecha: fecha,
      foto_evidencia: foto,
      productos: acumulados.map(item => ({
        producto_id: item.id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
        subtotal: item.subtotal
      })),
      total: acumulados.reduce((sum, item) => sum + item.subtotal, 0),
      fecha_creacion: new Date().toISOString()
    };
  };

  // Función para enviar reporte al servidor
  const enviarReporte = async (codigoPDV, correspondeA, kpiSeleccionado, fecha, foto, acumulados) => {
    // Validación base
    if (!codigoPDV || !correspondeA || !kpiSeleccionado || !fecha) {
      setSubmitError('Todos los campos son obligatorios');
      alert('Error: Todos los campos son obligatorios');
      return false;
    }

    // Validación específica para KPIs que requieren productos
    if ((kpiSeleccionado === 'Volumen' || kpiSeleccionado === 'Precio') && acumulados.length === 0) {
      setSubmitError('Debe seleccionar al menos un producto para este KPI');
      alert('Error: Debe seleccionar al menos un producto para este KPI');
      return false;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Crear FormData para enviar con la foto
      const formData = new FormData();
      formData.append('codigoPDV', codigoPDV);
      formData.append('correspondeA', correspondeA);
      formData.append('kpi', kpiSeleccionado);
      formData.append('fecha', fecha);
      formData.append('userId', userId);
      
      // Para KPI Frecuencia, enviar array vacío si no hay productos acumulados
      const productosEnvio = (kpiSeleccionado === 'Frecuencia' && acumulados.length === 0) ? [] : acumulados;
      formData.append('productos', JSON.stringify(productosEnvio));

      // Agregar foto si existe
      if (foto) {
        formData.append('foto', foto);
      }

      const response = await fetch(`${API_URL}/api/cargar-registro-pdv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitSuccess(true);
        
        // Mostrar mensaje de éxito con detalles
        alert(`✅ Reporte enviado exitosamente!\n\n`)
              // `📊 KPI: ${result.kpi_tipo}\n` +
              // `🏆 Puntos obtenidos: ${result.puntos_calculados}\n` +
              // `📋 ID de registro: ${result.registro_id}` +
              // (result.galonaje_registrado ? `\n⛽ Galonaje: ${result.galonaje_registrado}` : ''));
        
        // Recargar la página después de que el usuario cierre la alerta
        window.location.reload();
        
        return true;
      } else {
        throw new Error(result.message || 'Error al enviar el reporte');
      }
    } catch (error) {
      console.error('Error al enviar reporte:', error);
      setSubmitError(error.message);
      
      // Mostrar mensaje de error
      alert(`❌ Error al enviar el reporte:\n${error.message || 'Error desconocido'}`);
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para subir foto de evidencia
  const subirFotoEvidencia = async (file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch(`${API_URL}/api/upload-evidence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        return result.fileUrl;
      } else {
        throw new Error('Error al subir la foto');
      }
    } catch (error) {
      console.error('Error al subir foto:', error);
      // Para desarrollo, simular URL
      return `/storage/${new Date().toISOString().split('T')[0]}/${Date.now()}-evidence.jpg`;
    }
  };

  // Función para resetear el estado
  const resetearEstado = () => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  // Función para validar campos obligatorios
  const validarCampos = (codigoPDV, correspondeA, kpiSeleccionado, fecha, acumulados) => {
    const errores = [];

    if (!codigoPDV) errores.push('Código PDV es obligatorio');
    if (!correspondeA) errores.push('Nombre PDV es obligatorio');
    if (!kpiSeleccionado) errores.push('KPI es obligatorio');
    if (!fecha) errores.push('Fecha es obligatoria');
    
    // Solo validar productos para KPIs que los requieren
    if ((kpiSeleccionado === 'Volumen' || kpiSeleccionado === 'Precio') && acumulados.length === 0) {
      errores.push('Debe seleccionar al menos un producto para este KPI');
    }

    return errores;
  };

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    construirReporteFinal,
    enviarReporte,
    subirFotoEvidencia,
    resetearEstado,
    validarCampos
  };
};
