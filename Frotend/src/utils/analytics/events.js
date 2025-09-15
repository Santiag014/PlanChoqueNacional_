import { trackEvent, trackConversion, trackAuthEvent, trackAppError } from './analytics.js';
import { ANALYTICS_CONFIG } from './config.js';

// Eventos específicos de la aplicación Terpel

// ========== EVENTOS DE NAVEGACIÓN ==========
export const trackNavigation = (fromPage, toPage) => {
  trackEvent('navigation', 'user_flow', `${fromPage} -> ${toPage}`);
};

export const trackMenuClick = (menuItem, userRole) => {
  trackEvent('menu_click', 'navigation', `${menuItem} - ${userRole}`);
};

// ========== EVENTOS DE FORMULARIOS ==========
export const trackFormStart = (formName) => {
  trackEvent('form_start', 'engagement', formName);
};

export const trackFormSubmit = (formName, success = true) => {
  const action = success ? 'form_submit_success' : 'form_submit_error';
  trackEvent(action, 'engagement', formName);
  
  if (success) {
    trackConversion(ANALYTICS_CONFIG.CONVERSION_EVENTS.FORM_SUBMIT, null);
  }
};

export const trackFormField = (formName, fieldName, action = 'focus') => {
  trackEvent(`form_field_${action}`, 'engagement', `${formName} - ${fieldName}`);
};

// ========== EVENTOS DE REGISTRO E IMPLEMENTACIÓN ==========
export const trackRegistroImplementacion = (pdvId, asesorId) => {
  trackEvent('registro_implementacion', 'asesor_activity', `PDV: ${pdvId}`);
  trackConversion('implementacion_registro', 1);
};

export const trackRegistroVisita = (pdvId, asesorId, tipoVisita) => {
  trackEvent('registro_visita', 'asesor_activity', `${tipoVisita} - PDV: ${pdvId}`);
  trackConversion('visita_registro', 1);
};

export const trackRegistroGalonaje = (pdvId, asesorId, galones) => {
  trackEvent('registro_galonaje', 'asesor_activity', `PDV: ${pdvId}`);
  trackConversion('galonaje_registro', galones);
};

// ========== EVENTOS DE DESCARGA ==========
export const trackDownload = (fileName, fileType = 'unknown') => {
  trackEvent('download', 'engagement', `${fileType} - ${fileName}`);
  trackConversion(ANALYTICS_CONFIG.CONVERSION_EVENTS.DOWNLOAD, null);
};

export const trackExportData = (dataType, format, recordCount = null) => {
  trackEvent('export_data', 'data_export', `${dataType} - ${format}`);
  if (recordCount) {
    trackConversion('data_export', recordCount);
  }
};

// ========== EVENTOS DE BÚSQUEDA Y FILTROS ==========
export const trackSearch = (searchTerm, searchType = 'general') => {
  trackEvent('search', 'engagement', `${searchType} - ${searchTerm}`);
};

export const trackFilterUse = (filterType, filterValue) => {
  trackEvent('filter_use', 'engagement', `${filterType} - ${filterValue}`);
};

// ========== EVENTOS DE INTERACCIÓN ==========
export const trackButtonClick = (buttonName, context = 'general') => {
  trackEvent('button_click', 'engagement', `${context} - ${buttonName}`);
};

export const trackLinkClick = (linkText, destination) => {
  trackEvent('link_click', 'engagement', `${linkText} -> ${destination}`);
};

export const trackModalOpen = (modalName) => {
  trackEvent('modal_open', 'engagement', modalName);
};

export const trackModalClose = (modalName, method = 'unknown') => {
  trackEvent('modal_close', 'engagement', `${modalName} - ${method}`);
};

// ========== EVENTOS DE DASHBOARD ==========
export const trackDashboardView = (dashboardType, userRole) => {
  trackEvent('dashboard_view', 'page_view', `${dashboardType} - ${userRole}`);
};

export const trackChartInteraction = (chartType, interaction) => {
  trackEvent('chart_interaction', 'engagement', `${chartType} - ${interaction}`);
};

// ========== EVENTOS DE AUTENTICACIÓN ==========
export const trackLogin = (userRole, method = 'form', success = true) => {
  trackAuthEvent('login', userRole, success);
  if (success) {
    trackConversion(ANALYTICS_CONFIG.CONVERSION_EVENTS.LOGIN, null);
  }
};

export const trackLogout = (userRole = null) => {
  trackAuthEvent('logout', userRole, true);
};

export const trackSessionExpired = (userRole = null) => {
  trackAuthEvent('session_expired', userRole, false);
};

// ========== EVENTOS DE API ==========
export const trackApiCall = (endpoint, method, success = true, responseTime = null) => {
  const action = success ? 'api_success' : 'api_error';
  trackEvent(action, 'api', `${method} ${endpoint}`);
  
  if (responseTime) {
    trackEvent('api_response_time', 'performance', endpoint, responseTime);
  }
};

export const trackApiError = (endpoint, method, errorCode, errorMessage) => {
  trackAppError('api_error', `${method} ${endpoint} - ${errorCode}: ${errorMessage}`);
};

// ========== EVENTOS DE PERFORMANCE ==========
export const trackPageLoadTime = (pageName, loadTime) => {
  trackEvent('page_load_time', 'performance', pageName, Math.round(loadTime));
};

export const trackUserTiming = (name, duration) => {
  trackEvent('user_timing', 'performance', name, Math.round(duration));
};

// ========== EVENTOS DE ERRORES ==========
export const trackJavaScriptError = (errorMessage, fileName, lineNumber) => {
  trackAppError('javascript_error', errorMessage, `${fileName}:${lineNumber}`);
};

export const trackUserError = (errorType, errorMessage, context = null) => {
  trackAppError('user_error', errorMessage, context);
};

// ========== EVENTOS ESPECÍFICOS DE TERPEL ==========
export const trackPDVInteraction = (pdvId, action, asesorId) => {
  trackEvent('pdv_interaction', 'business_action', `${action} - PDV: ${pdvId} - Asesor: ${asesorId}`);
};

export const trackZoneActivity = (zoneId, activity, userRole) => {
  trackEvent('zone_activity', 'business_action', `${activity} - Zona: ${zoneId} - ${userRole}`);
};

export const trackIncentiveView = (incentiveType, userRole) => {
  trackEvent('incentive_view', 'business_engagement', `${incentiveType} - ${userRole}`);
};

export const trackRankingView = (rankingType, userRole, position = null) => {
  const label = position ? `${rankingType} - Posición: ${position}` : rankingType;
  trackEvent('ranking_view', 'business_engagement', `${label} - ${userRole}`);
};

// ========== EVENTOS DE NOTIFICACIONES ==========
export const trackNotificationReceived = (notificationType, userRole) => {
  trackEvent('notification_received', 'engagement', `${notificationType} - ${userRole}`);
};

export const trackNotificationClick = (notificationType, userRole) => {
  trackEvent('notification_click', 'engagement', `${notificationType} - ${userRole}`);
};
