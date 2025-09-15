// Validador del sistema de Analytics
import { ANALYTICS_CONFIG } from './config.js';

export const validateAnalytics = () => {
  const results = {
    valid: true,
    issues: [],
    warnings: [],
    info: []
  };

  // 1. Verificar configuración básica
  if (!ANALYTICS_CONFIG.GA_TRACKING_ID) {
    results.valid = false;
    //results.issues.push('❌ Google Analytics ID no configurado');
  } else if (!ANALYTICS_CONFIG.GA_TRACKING_ID.startsWith('G-')) {
    results.valid = false;
    //results.issues.push('❌ Google Analytics ID tiene formato incorrecto');
  } else {
    //results.info.push(`✅ Google Analytics ID configurado: ${ANALYTICS_CONFIG.GA_TRACKING_ID}`);
  }

  // 2. Verificar que gtag esté disponible
  if (typeof window !== 'undefined') {
    if (typeof window.gtag === 'undefined') {
      //results.warnings.push('⚠️ gtag no está disponible (puede ser normal en desarrollo)');
    } else {
      //results.info.push('✅ gtag está disponible y funcionando');
    }

    if (!window.dataLayer) {
     //results.warnings.push('⚠️ dataLayer no está inicializado');
    } else {
      //results.info.push('✅ dataLayer está inicializado');
    }
  }

  // 3. Verificar estructura de archivos
  const requiredFiles = [
    'utils/analytics/config.js',
    'utils/analytics/analytics.js', 
    'utils/analytics/events.js',
    'utils/analytics/index.js',
    'hooks/useAnalytics.js',
    'contexts/AnalyticsContext.jsx'
  ];

  // Esta verificación solo es informativa ya que no podemos verificar archivos desde el código
  //results.info.push(`📁 Archivos requeridos: ${requiredFiles.length} archivos estructurados`);

  // 4. Verificar configuración de entorno
  if (ANALYTICS_CONFIG.DEBUG) {
    //results.info.push('🐛 Modo debug activado - se mostrarán logs detallados');
  } else {
    //results.info.push('🚀 Modo producción - logs de debug desactivados');
  }

  // 5. Verificar eventos personalizados
  if (ANALYTICS_CONFIG.CUSTOM_DIMENSIONS) {
    //results.info.push('📊 Dimensiones personalizadas configuradas');
  }

  if (ANALYTICS_CONFIG.CONVERSION_EVENTS) {
    //results.info.push('🎯 Eventos de conversión configurados');
  }

  return results;
};

// Función para ejecutar validación y mostrar resultados
export const runAnalyticsValidation = () => {
  //console.log('🔍 Validando sistema de Google Analytics...\n');
  
  const results = validateAnalytics();
  
  // Mostrar issues (errores críticos)
  if (results.issues.length > 0) {
    //console.log('🚨 PROBLEMAS CRÍTICOS:');
    results.issues.forEach(issue => console.log(issue));
    //console.log('');
  }
  
  // Mostrar warnings
  if (results.warnings.length > 0) {
    //console.log('⚠️ ADVERTENCIAS:');
    results.warnings.forEach(warning => console.log(warning));
    //console.log('');
  }
  
  // Mostrar información
  if (results.info.length > 0) {
    //console.log('ℹ️ INFORMACIÓN:');
    results.info.forEach(info => console.log(info));
    //console.log('');
  }
  
  // Resultado final
  if (results.valid) {
    //console.log('✅ VALIDACIÓN EXITOSA: El sistema de Analytics está configurado correctamente');
  } else {
    //console.log('❌ VALIDACIÓN FALLIDA: Hay problemas críticos que deben solucionarse');
  }

  //console.log('\n📖 Para más información, consulta el archivo ANALYTICS.md');

  return results;
};

// Auto-ejecutar validación en desarrollo
if (import.meta.env.DEV) {
  // Esperar un poco para que todo se inicialice
  setTimeout(() => {
    runAnalyticsValidation();
  }, 2000);
}
