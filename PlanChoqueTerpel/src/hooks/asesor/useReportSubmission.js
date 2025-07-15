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

  // Construir reporte final
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

  // Enviar reporte al servidor
  const enviarReporte = async (params) => {
    console.log('Params completos al inicio:', params);  // <-- imprime siempre
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      let payload;
      let isFormData = false;

      // VISITA SIMPLE
      if (params.visitaSimple) {
        if (!params.pdv_id || !params.fecha || !params.numero_visita) {
          setSubmitError('Faltan campos obligatorios para la visita');
          alert('Error: Faltan campos obligatorios para la visita');
          setIsSubmitting(false);
          return false;
        }
        payload = new FormData();
        payload.append('pdv_id', params.pdv_id);
        payload.append('user_id', userId);
        payload.append('fecha', params.fecha);
        payload.append('numero_visita', params.numero_visita);
        isFormData = true;
        if (params.foto_seguimiento) {
          payload.append('foto_seguimiento', params.foto_seguimiento);
        }
        isFormData = true;
        
      } else {
        // Validación mejorada para registro completo
        console.log('Params recibidos:', params); // debug

        // pdv_id puede ser string o número, pero debe existir y no estar vacío
        if (params.pdv_id === undefined || params.pdv_id === null || String(params.pdv_id).trim() === '') {
          setSubmitError('Falta el Punto de venta');
          alert('Error: Falta el Punto de venta');
          setIsSubmitting(false);
          return false;
        }

        // fecha debe ser string no vacía
        if (typeof params.fecha !== 'string' || params.fecha.trim() === '') {
          setSubmitError('Falta la fecha');
          alert('Error: Falta la fecha');
          setIsSubmitting(false);
          return false;
        }

        // productos debe ser array con al menos un elemento
        if (!Array.isArray(params.productos) || params.productos.length === 0) {
          setSubmitError('Debe agregar al menos un producto');
          alert('Error: Debe agregar al menos un producto');
          setIsSubmitting(false);
          return false;
        }

        // fotos debe ser objeto que contenga las claves necesarias
        if (
          !params.fotos ||
          typeof params.fotos !== 'object' ||
          !('factura' in params.fotos) ||
          !('implementacion' in params.fotos)
        ) {
          setSubmitError('Debe adjuntar fotos válidas');
          alert('Error: Debe adjuntar fotos válidas');
          setIsSubmitting(false);
          return false;
        }

        // Preparar FormData
        payload = new FormData();
        payload.append('pdv_id', params.pdv_id);
        payload.append('fecha', params.fecha);
        payload.append('user_id', userId);
        payload.append('productos', JSON.stringify(params.productos));
        payload.append('fotos', JSON.stringify(params.fotos));

        // Adjuntar archivos de fotos reales si existen
        (params.fotos?.factura || []).forEach((file, idx) => {
          if (file) payload.append(`factura_${idx}`, file);
        });
        (params.fotos?.implementacion || []).forEach((file, idx) => {
          if (file) payload.append(`implementacion_${idx}`, file);
        });

        isFormData = true;

        // Depuración: mostrar contenido del FormData
        for (let pair of payload.entries()) {
          console.log('FormData:', pair[0], pair[1]);
        }
      }

      // Enviar a la API
      const response = await fetch(`${API_URL}/api/cargar-registro-pdv`, {
        method: 'POST',
        headers: {
          ...(isFormData
            ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            : {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
          )
        },
        body: payload
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitSuccess(true);
        // No alert, el modal se maneja en el componente
        return true;
      } else {
        throw new Error(result.message || 'Error al enviar el reporte');
      }

    } catch (error) {
      console.error('Error al enviar reporte:', error);
      setSubmitError(error.message);
      alert(`❌ Error al enviar el reporte:\n${error.message || 'Error desconocido'}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resetear estado
  const resetearEstado = () => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  // Validar campos antes de enviar
  const validarCampos = (codigoPDV, correspondeA, kpiSeleccionado, fecha, acumulados) => {
    const errores = [];

    if (!codigoPDV) errores.push('Código PDV es obligatorio');
    if (!correspondeA) errores.push('Nombre PDV es obligatorio');
    if (!kpiSeleccionado) errores.push('KPI es obligatorio');
    if (!fecha) errores.push('Fecha es obligatoria');

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
    resetearEstado,
    validarCampos
  };
};
