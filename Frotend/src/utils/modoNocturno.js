/**
 * UTILIDADES PARA MODO NOCTURNO - TERPEL
 * 
 * Este archivo contiene funciones utilitarias para manejar el modo nocturno
 * en la aplicación de Terpel, especialmente para popups, modales y filtros.
 */

/**
 * Detecta si el usuario prefiere el modo oscuro
 * @returns {boolean} true si prefiere modo oscuro
 */
export const prefiereModOscuro = () => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Aplica forzadamente el modo nocturno a toda la aplicación
 * @param {boolean} activar - true para activar, false para desactivar
 */
export const forzarModoNocturno = (activar = true) => {
  const body = document.body;
  
  if (activar) {
    body.classList.add('modo-nocturno');
    localStorage.setItem('modo-nocturno', 'true');
  } else {
    body.classList.remove('modo-nocturno');
    localStorage.setItem('modo-nocturno', 'false');
  }
};

/**
 * Obtiene el estado actual del modo nocturno
 * @returns {boolean} true si está activo el modo nocturno
 */
export const obtenerEstadoModoNocturno = () => {
  const almacenado = localStorage.getItem('modo-nocturno');
  if (almacenado !== null) {
    return almacenado === 'true';
  }
  return prefiereModOscuro();
};

/**
 * Inicializa el modo nocturno basado en las preferencias del usuario
 */
export const inicializarModoNocturno = () => {
  const modoNocturnoActivo = obtenerEstadoModoNocturno();
  forzarModoNocturno(modoNocturnoActivo);
  
  // Escuchar cambios en las preferencias del sistema
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // Solo cambiar si no hay preferencia manual guardada
      if (localStorage.getItem('modo-nocturno') === null) {
        forzarModoNocturno(e.matches);
      }
    });
  }
};

/**
 * Alterna entre modo claro y oscuro
 */
export const alternarModoNocturno = () => {
  const estadoActual = obtenerEstadoModoNocturno();
  forzarModoNocturno(!estadoActual);
  return !estadoActual;
};

/**
 * Aplica estilos específicos para inputs de fecha en modo nocturno
 * Útil para navegadores que no soportan color-scheme automáticamente
 */
export const arreglarInputsFecha = () => {
  const inputsFecha = document.querySelectorAll('input[type="date"], input[type="datetime-local"], input[type="time"]');
  
  inputsFecha.forEach(input => {
    if (obtenerEstadoModoNocturno()) {
      input.classList.add('force-dark-date-input');
    } else {
      input.classList.remove('force-dark-date-input');
    }
  });
};

/**
 * Observador de mutaciones para aplicar automáticamente estilos a nuevos elementos
 */
export const iniciarObservadorModoNocturno = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Buscar inputs de fecha en los nuevos elementos
            const inputsFecha = node.querySelectorAll ? 
              node.querySelectorAll('input[type="date"], input[type="datetime-local"], input[type="time"]') : 
              [];
              
            inputsFecha.forEach(input => {
              if (obtenerEstadoModoNocturno()) {
                input.classList.add('force-dark-date-input');
              }
            });
            
            // Si el nodo en sí es un input de fecha
            if (node.matches && node.matches('input[type="date"], input[type="datetime-local"], input[type="time"]')) {
              if (obtenerEstadoModoNocturno()) {
                node.classList.add('force-dark-date-input');
              }
            }
          }
        });
      }
    });
  });
  
  // Observar cambios en todo el documento
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
};

/**
 * Función para debug - reporta el estado actual del modo nocturno
 */
export const debugModoNocturno = () => {
  console.log('=== DEBUG MODO NOCTURNO ===');
  console.log('Preferencia del sistema:', prefiereModOscuro());
  console.log('Estado almacenado:', localStorage.getItem('modo-nocturno'));
  console.log('Estado actual:', obtenerEstadoModoNocturno());
  console.log('Clase en body:', document.body.classList.contains('modo-nocturno'));
  console.log('Inputs de fecha encontrados:', document.querySelectorAll('input[type="date"], input[type="datetime-local"], input[type="time"]').length);
  console.log('==========================');
};

/**
 * Hook personalizado para React (opcional)
 * Usar así: const { modoNocturno, alternar } = useModoNocturno();
 */
export const useModoNocturno = () => {
  const [modoNocturno, setModoNocturno] = React.useState(obtenerEstadoModoNocturno);
  
  const alternar = React.useCallback(() => {
    const nuevoEstado = alternarModoNocturno();
    setModoNocturno(nuevoEstado);
    arreglarInputsFecha();
  }, []);
  
  React.useEffect(() => {
    inicializarModoNocturno();
    arreglarInputsFecha();
    
    const observer = iniciarObservadorModoNocturno();
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  React.useEffect(() => {
    arreglarInputsFecha();
  }, [modoNocturno]);
  
  return { modoNocturno, alternar };
};

// Funciones específicas para problemas comunes

/**
 * Fuerza la actualización de todos los modales abiertos
 */
export const actualizarModalesAbiertos = () => {
  const modales = document.querySelectorAll('.modal-overlay, .modal-content');
  modales.forEach(modal => {
    // Forzar repaint
    modal.style.display = 'none';
    modal.offsetHeight; // trigger reflow
    modal.style.display = '';
  });
};

/**
 * Fuerza la actualización de todos los filtros
 */
export const actualizarFiltros = () => {
  const filtros = document.querySelectorAll('.filter-panel, .filters-content');
  filtros.forEach(filtro => {
    // Forzar repaint
    filtro.style.opacity = '0.99';
    setTimeout(() => {
      filtro.style.opacity = '';
    }, 1);
  });
};

/**
 * Función de inicialización completa
 * Llamar esta función al cargar la aplicación
 */
export const inicializarSistemaModoNocturno = () => {
  console.log('🌙 Inicializando sistema de modo nocturno...');
  
  try {
    inicializarModoNocturno();
    arreglarInputsFecha();
    iniciarObservadorModoNocturno();
    
    // Aplicar estilos a elementos existentes
    setTimeout(() => {
      actualizarModalesAbiertos();
      actualizarFiltros();
    }, 100);
    
    console.log('✅ Sistema de modo nocturno inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar modo nocturno:', error);
  }
};

// Auto-inicialización si el archivo se carga directamente
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarSistemaModoNocturno);
} else if (typeof window !== 'undefined') {
  inicializarSistemaModoNocturno();
}
