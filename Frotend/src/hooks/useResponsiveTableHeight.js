import { useState, useEffect } from 'react';

/**
 *        
        // Padding adicional para evitar superposiciones (MUY conservador)
        const additionalPadding = isMobileDevice ? 10 : 30;
        
        // Calcular altura disponible
        const availableHeight = windowHeight - headerHeight - footerHeight - filtersHeight - additionalPadding;
        
        // Establecer límites mínimos y máximos responsivos (MUY agresivos para usar TODO el espacio)
        const minHeight = isMobileDevice ? 150 : 200;
        const maxHeight = windowHeight * (isMobileDevice ? 0.85 : 0.9); // 85% en móvil, 90% en desktop
        
        const optimalHeight = Math.max(minHeight, Math.min(availableHeight, maxHeight));alizado para calcular la altura dinámica de tablas responsive
 * Detecta automáticamente el footer, header y otros elementos para evitar superposiciones
 */
export const useResponsiveTableHeight = () => {
  const [tableHeight, setTableHeight] = useState('60vh');
  const [dimensions, setDimensions] = useState({
    windowHeight: 0,
    headerHeight: 0,
    footerHeight: 0,
    filtersHeight: 0,
    availableHeight: 0
  });

  // Función auxiliar para detectar dispositivos móviles
  const isMobile = () => {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  useEffect(() => {
    const calculateOptimalHeight = () => {
      try {
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const isMobileDevice = isMobile();
        
        // Detectar elementos automáticamente (específicos de Terpel)
        const header = document.querySelector('.dashboard-header, .dashboard-mobile-header, header, .navbar, .app-header');
        const footer = document.querySelector('[style*="position: fixed"][style*="bottom: 0"], footer, .dashboard-footer, .app-footer, .footer, .footer-terpel');
        const filtersContainer = document.querySelector('.filtros-container-collapsible');
        const filtersHeader = document.querySelector('.filtros-header');
        const filtersContent = document.querySelector('.filtros-content');
        
        // Calcular alturas reales de los elementos con ajustes móviles
        const headerHeight = header ? header.offsetHeight : (isMobileDevice ? 70 : 60);
        
        // Para el footer, intentar detectar el footer real de Terpel
        let footerHeight = 45; // Default
        if (footer) {
          footerHeight = footer.offsetHeight;
        } else {
          // Buscar el footer específico de Terpel por texto
          const terpelFooter = document.querySelector('*:contains("TERPEL 2025")') || 
                             document.querySelector('*:contains("TODOS LOS DERECHOS RESERVADOS")');
          if (terpelFooter) {
            footerHeight = terpelFooter.offsetHeight || (isMobileDevice ? 40 : 45);
          } else {
            footerHeight = isMobileDevice ? 35 : 45;
          }
        }
        
        console.log('🦶 Footer detectado:', {
          element: footer ? 'Encontrado' : 'No encontrado',
          height: `${footerHeight}px`
        });
        
        // Calcular altura de filtros dinámicamente
        let filtersHeight = isMobileDevice ? 70 : 80; // Altura mínima del header de filtros
        
        if (filtersContainer) {
          if (filtersContent && filtersContent.classList.contains('expanded')) {
            // Si los filtros están expandidos, usar la altura total
            filtersHeight = filtersContainer.offsetHeight;
            console.log('🔍 Filtros EXPANDIDOS - Altura:', filtersHeight);
          } else {
            // Si están contraídos, solo contar el header + márgenes
            filtersHeight = filtersHeader ? filtersHeader.offsetHeight + (isMobileDevice ? 15 : 20) : (isMobileDevice ? 70 : 80);
            console.log('🔍 Filtros CONTRAÍDOS - Altura:', filtersHeight);
          }
        } else {
          console.log('⚠️ No se encontró contenedor de filtros');
        }
        
        // Padding adicional para evitar superposiciones
        const additionalPadding = isMobile() ? 30 : 40;
        
        // Calcular altura disponible
        const availableHeight = windowHeight - headerHeight - footerHeight - filtersHeight - additionalPadding;
        
        // Establecer límites mínimos y máximos responsivos (MUY agresivos para usar TODO el espacio)
        const minHeight = isMobileDevice ? 150 : 200;
        const maxHeight = windowHeight * (isMobileDevice ? 0.85 : 0.9); // 85% en móvil, 90% en desktop
        
        const optimalHeight = Math.max(minHeight, Math.min(availableHeight, maxHeight));
        
        // FORZAR altura más agresiva en móviles si hay mucho espacio disponible
        let finalHeight = optimalHeight;
        if (isMobileDevice && availableHeight > optimalHeight + 50) {
          // Si hay más de 50px de espacio extra, usar más espacio
          finalHeight = Math.min(availableHeight - 5, maxHeight);
        }
        
        // Establecer variables CSS dinámicamente
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
        document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
        document.documentElement.style.setProperty('--filters-height', `${filtersHeight}px`);
        document.documentElement.style.setProperty('--table-height', `${finalHeight}px`);
        
        setTableHeight(`${finalHeight}px`);
        setDimensions({
          windowHeight,
          headerHeight,
          footerHeight,
          filtersHeight,
          availableHeight: finalHeight
        });
        
        console.log('📏 📱 CÁLCULO MÓVIL SUPER AGRESIVO:', {
          '📱 Info del dispositivo': {
            windowHeight: `${windowHeight}px`,
            windowWidth: `${windowWidth}px`,
            isMobileDevice,
            orientation: window.screen.orientation?.type || 'unknown'
          },
          '📊 Elementos detectados': {
            header: header ? `✅ ${headerHeight}px` : '❌ No encontrado',
            footer: footer ? `✅ ${footerHeight}px` : '❌ No encontrado', 
            filtersHeight: `${filtersHeight}px`
          },
          '📐 Cálculos finales': {
            availableHeight: `${availableHeight}px`,
            optimalHeight: `${optimalHeight}px`,
            additionalPadding: `${additionalPadding}px`,
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            '🎯 ALTURA FINAL FORZADA': `${finalHeight}px`,
            spaceSaved: `${availableHeight - finalHeight}px`
          }
        });
        
        console.log('📏 � CÁLCULO MÓVIL OPTIMIZADO:', {
          '� Info del dispositivo': {
            windowHeight: `${windowHeight}px`,
            windowWidth: `${windowWidth}px`,
            isMobileDevice,
            orientation: window.screen.orientation?.type || 'unknown',
            userAgent: isMobileDevice ? 'Mobile detected' : 'Desktop detected'
          },
          '📊 Elementos detectados': {
            header: header ? `✅ ${headerHeight}px` : '❌ No encontrado',
            footer: footer ? `✅ ${footerHeight}px` : '❌ No encontrado', 
            filtersContainer: filtersContainer ? '✅ Encontrado' : '❌ No encontrado',
            filtersHeader: filtersHeader ? '✅ Encontrado' : '❌ No encontrado',
            filtersContent: filtersContent ? '✅ Encontrado' : '❌ No encontrado'
          },
          '🔍 Estado de filtros': {
            filtersExpanded: filtersContent ? filtersContent.classList.contains('expanded') : 'N/A',
            filtersHeight: `${filtersHeight}px`
          },
          '📐 Cálculos finales': {
            availableHeight: `${availableHeight}px`,
            additionalPadding: `${additionalPadding}px`,
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            '🎯 ALTURA FINAL': `${optimalHeight}px`
          }
        });
        
      } catch (error) {
        console.warn('⚠️ Error calculando altura de tabla, usando fallback:', error);
        setTableHeight('60vh'); // Fallback
      }
    };

    // Calcular inmediatamente
    calculateOptimalHeight();

    // Recalcular en resize con debounce
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculateOptimalHeight, 150);
    };

    // Recalcular cuando se carga el DOM completamente
    const handleDOMContentLoaded = () => {
      // Múltiples intentos para asegurar que todos los elementos estén renderizados
      setTimeout(calculateOptimalHeight, 100);
      setTimeout(calculateOptimalHeight, 300);
      setTimeout(calculateOptimalHeight, 600);
      setTimeout(calculateOptimalHeight, 1000);
    };

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      // En móviles, esperar un poco más para que se complete el cambio de orientación
      setTimeout(calculateOptimalHeight, 200);
      setTimeout(calculateOptimalHeight, 500);
    });
    document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
    
    // Listener personalizado para cuando se cargan los datos
    window.addEventListener('tableDataLoaded', calculateOptimalHeight);
    
    // Listener específico para móviles cuando se redimensiona la ventana
    if (isMobile()) {
      window.addEventListener('scroll', () => {
        // Recalcular en scroll para detectar cambios de viewport en móviles
        clearTimeout(window.mobileScrollTimeout);
        window.mobileScrollTimeout = setTimeout(calculateOptimalHeight, 100);
      });
    }

    // Observer para detectar cambios en los filtros (expansión/contracción)
    let filtersObserver;
    const filtersContainer = document.querySelector('.filtros-container-collapsible');
    if (filtersContainer) {
      filtersObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            // Recalcular altura cuando cambia la clase (expandido/contraído)
            setTimeout(calculateOptimalHeight, 100);
          }
        });
      });
      
      const filtersContent = document.querySelector('.filtros-content');
      if (filtersContent) {
        filtersObserver.observe(filtersContent, { 
          attributes: true, 
          attributeFilter: ['class'] 
        });
      }
    }

    // Cleanup
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', calculateOptimalHeight);
      document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);
      window.removeEventListener('tableDataLoaded', calculateOptimalHeight);
      
      // Limpiar timeout de móviles si existe
      if (window.mobileScrollTimeout) {
        clearTimeout(window.mobileScrollTimeout);
      }
      
      if (filtersObserver) {
        filtersObserver.disconnect();
      }
    };
  }, []);

  // Función para forzar recálculo (útil cuando cambian filtros o contenido dinámico)
  const recalculateHeight = () => {
    setTimeout(() => {
      const event = new Event('resize');
      window.dispatchEvent(event);
    }, 100);
  };

  return {
    tableHeight,
    dimensions,
    recalculateHeight
  };
};

export default useResponsiveTableHeight;
