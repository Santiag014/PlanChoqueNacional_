import { useState, useEffect } from 'react';

/**
 * Hook para obtener información de implementaciones (categorías y descripciones)
 * NOTA: Los productos reales se obtienen del endpoint /productos-implementacion
 * Este hook solo proporciona metadata descriptiva para mostrar en la UI
 * 
 * @returns {Object} Información descriptiva de implementaciones
 */
export const useImplementacionInfo = () => {
  const [productosRequeridos, setProductosRequeridos] = useState({});

  useEffect(() => {
    // Definir información de implementaciones (categorías y descripciones)
    // Los productos reales se obtienen del endpoint /productos-implementacion
    const productos = {
      1: {
        categoria: 'Básica',
        descripcion: 'Implementación inicial con productos esenciales'
      },
      2: {
        categoria: 'Intermedia', 
        descripcion: 'Ampliación con productos de transmisión'
      },
      3: {
        categoria: 'Avanzada',
        descripcion: 'Portafolio completo con especialidades'
      },
      4: {
        categoria: 'Premium',
        descripcion: 'Línea premium con productos sintéticos'
      },
      5: {
        categoria: 'Completa',
        descripcion: 'Implementación completa con productos industriales'
      }
    };

    setProductosRequeridos(productos);
  }, []);

  return {
    productosRequeridos,
    getProductosPorImplementacion: (numero) => productosRequeridos[numero] || null,
    getCategoriaImplementacion: (numero) => productosRequeridos[numero]?.categoria || 'N/A',
    getDescripcionImplementacion: (numero) => productosRequeridos[numero]?.descripcion || 'Sin descripción'
  };
};

export default useImplementacionInfo;
