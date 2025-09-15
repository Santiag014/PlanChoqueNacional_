import React, { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';

const AnalyticsTestComponent = () => {
  const analytics = useAnalytics();
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (testName, success = true) => {
    const result = {
      test: testName,
      success,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Mantener solo los últimos 10
  };

  const testEvents = [
    {
      name: 'Rastrear Click de Botón',
      action: () => {
        analytics.trackButtonClick('test-button', 'analytics-test');
        addTestResult('Button Click');
      }
    },
    {
      name: 'Rastrear Envío de Formulario',
      action: () => {
        analytics.trackFormSubmit('test-form', true);
        addTestResult('Form Submit');
      }
    },
    {
      name: 'Rastrear Descarga',
      action: () => {
        analytics.trackDownload('test-file.pdf', 'pdf');
        addTestResult('Download');
      }
    },
    {
      name: 'Rastrear Búsqueda',
      action: () => {
        analytics.trackSearch('test search query');
        addTestResult('Search');
      }
    },
    {
      name: 'Rastrear Login',
      action: () => {
        analytics.trackLogin('asesor', 'form', true);
        addTestResult('Login');
      }
    },
    {
      name: 'Rastrear Registro Implementación',
      action: () => {
        analytics.trackRegistroImplementacion('PDV001', 'ASESOR001');
        addTestResult('Registro Implementación');
      }
    },
    {
      name: 'Rastrear Navegación',
      action: () => {
        analytics.trackNavigation('home', 'dashboard');
        addTestResult('Navigation');
      }
    },
    {
      name: 'Rastrear API Call',
      action: () => {
        analytics.trackApiCall('/api/test', 'GET', true, 150);
        addTestResult('API Call');
      }
    },
    {
      name: 'Rastrear Error (Test)',
      action: () => {
        analytics.trackUserError('test_error', 'Error de prueba para testing');
        addTestResult('Error Tracking');
      }
    },
    {
      name: 'Rastrear Conversión',
      action: () => {
        analytics.trackConversion('test_conversion', 100);
        addTestResult('Conversion');
      }
    }
  ];

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #e30613', 
      margin: '10px',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3 style={{ color: '#e30613', marginBottom: '15px' }}>
        🧪 Centro de Pruebas de Google Analytics
      </h3>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Estos botones envían eventos específicos a Google Analytics. 
        Abre las Herramientas de Desarrollador (F12) para ver los logs.
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '10px',
        marginBottom: '20px'
      }}>
        {testEvents.map((test, index) => (
          <button 
            key={index}
            onClick={test.action}
            style={{ 
              padding: '10px 15px',
              backgroundColor: '#e30613',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c10512'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#e30613'}
          >
            {test.name}
          </button>
        ))}
      </div>

      {testResults.length > 0 && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          <h4 style={{ color: '#333', marginBottom: '10px' }}>
            📊 Últimos Eventos Enviados:
          </h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{ 
                  padding: '5px 10px',
                  margin: '2px 0',
                  backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                  color: result.success ? '#155724' : '#721c24',
                  borderRadius: '3px',
                  fontSize: '13px'
                }}
              >
                <strong>{result.timestamp}</strong> - {result.test} 
                {result.success ? ' ✅' : ' ❌'}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#856404'
      }}>
        <strong>💡 Tip:</strong> Abre las Herramientas de Desarrollador (F12) → Consola 
        para ver los logs detallados de cada evento enviado a Google Analytics.
      </div>
    </div>
  );
};

export default AnalyticsTestComponent;
