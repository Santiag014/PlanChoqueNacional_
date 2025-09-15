import React from 'react';
import DashboardLayout from '../components/DashboardLayout';

const DiagnosticoPowerBI = () => {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  
  let tokenPayload = null;
  try {
    if (token && token !== 'legacy_auth') {
      tokenPayload = JSON.parse(atob(token.split('.')[1]));
    }
  } catch (e) {
    console.error('Error decodificando token:', e);
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#d6001c' }}>🔍 Diagnóstico PowerBI</h1>
        
        <div style={{ 
          background: '#f5f5f5', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h2>📊 Datos del Usuario (localStorage)</h2>
          <pre style={{ 
            background: 'white', 
            padding: '10px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(userData, null, 2)}
          </pre>
          
          <h3>🔗 Campos PowerBI Específicos:</h3>
          <ul>
            <li><strong>powerBI:</strong> {userData.powerBI || 'No definido'}</li>
            <li><strong>power_bi:</strong> {userData.power_bi || 'No definido'}</li>
            <li><strong>powerbi:</strong> {userData.powerbi || 'No definido'}</li>
          </ul>
        </div>

        {token && token !== 'legacy_auth' && (
          <div style={{ 
            background: '#e3f2fd', 
            padding: '20px', 
            borderRadius: '8px',
            marginBottom: '20px' 
          }}>
            <h2>🎫 Payload del Token JWT</h2>
            <pre style={{ 
              background: 'white', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(tokenPayload, null, 2)}
            </pre>
            
            {tokenPayload && (
              <>
                <h3>🔗 Campos PowerBI en Token:</h3>
                <ul>
                  <li><strong>powerBI:</strong> {tokenPayload.powerBI || 'No definido'}</li>
                  <li><strong>powerbiLink:</strong> {tokenPayload.powerbiLink || 'No definido'}</li>
                  <li><strong>powerbi_link:</strong> {tokenPayload.powerbi_link || 'No definido'}</li>
                </ul>
              </>
            )}
          </div>
        )}

        <div style={{ 
          background: '#fff3e0', 
          padding: '20px', 
          borderRadius: '8px' 
        }}>
          <h2>💡 Recomendaciones</h2>
          <ol>
            <li>Verifica que el usuario tenga el campo <code>power_bi</code> configurado en la base de datos</li>
            <li>Asegúrate de que el enlace de PowerBI sea válido</li>
            <li>Confirma que el usuario tenga los permisos correctos</li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DiagnosticoPowerBI;
