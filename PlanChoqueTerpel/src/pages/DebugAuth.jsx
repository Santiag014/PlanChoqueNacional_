import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';

/**
 * Página temporal para debuggear la autenticación
 */
export default function DebugAuth() {
  const { user, isAuthenticated, hasRole, loading, token } = useAuthContext();

  const checkAsesorRole = () => {
    return hasRole(['asesor', 'ASESOR', 1]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug de Autenticación</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Estado General:</h3>
        <p><strong>Loading:</strong> {loading ? 'Sí' : 'No'}</p>
        <p><strong>Autenticado:</strong> {isAuthenticated() ? 'Sí' : 'No'}</p>
        <p><strong>Token presente:</strong> {token ? 'Sí' : 'No'}</p>
        <p><strong>Token value:</strong> {token || 'No hay token'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Datos del Usuario:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Verificación de Roles:</h3>
        <p><strong>¿Es Asesor?:</strong> {checkAsesorRole() ? 'Sí' : 'No'}</p>
        <p><strong>Tipo de usuario:</strong> {user?.tipo || 'No definido'}</p>
        <p><strong>Rol (string):</strong> {user?.rol || 'No definido'}</p>
        <p><strong>Rol ID (number):</strong> {user?.rol_id || 'No definido'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>LocalStorage:</h3>
        <p><strong>Usuario guardado:</strong></p>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {localStorage.getItem('user') || 'No hay datos'}
        </pre>
        <p><strong>Token guardado:</strong></p>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {localStorage.getItem('authToken') || 'No hay token'}
        </pre>
      </div>

      <div>
        <h3>Pruebas de Roles:</h3>
        <p><strong>hasRole(['asesor']):</strong> {hasRole(['asesor']) ? 'Sí' : 'No'}</p>
        <p><strong>hasRole(['ASESOR']):</strong> {hasRole(['ASESOR']) ? 'Sí' : 'No'}</p>
        <p><strong>hasRole([1]):</strong> {hasRole([1]) ? 'Sí' : 'No'}</p>
        <p><strong>hasRole(['asesor', 'ASESOR', 1]):</strong> {hasRole(['asesor', 'ASESOR', 1]) ? 'Sí' : 'No'}</p>
      </div>
    </div>
  );
}
