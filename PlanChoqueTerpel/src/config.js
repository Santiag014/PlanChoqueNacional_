// Cambia aquí la URL base de la API según tu entorno
export const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : window.location.origin;
