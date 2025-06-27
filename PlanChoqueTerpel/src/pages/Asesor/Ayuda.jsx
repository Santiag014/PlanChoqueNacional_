import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAsesorRoute } from '../../hooks/auth';

export default function Ayuda() {
  const { user, loading, isAuthenticated, hasRequiredRole } = useAsesorRoute();

  if (loading) {
    return <div className="loading-container">Verificando autenticación...</div>;
  }

  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 30,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: 600,
        width: '100%'
      }}>
        <h1 style={{
          color: '#e30613',
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 20
        }}>
          Centro de Ayuda
        </h1>
        
        <div style={{ color: '#666', lineHeight: 1.6 }}>
          <h3 style={{ color: '#e30613', marginBottom: 10 }}>¿Cómo usar el sistema?</h3>
          <p>Aquí encontrarás información sobre cómo usar todas las funcionalidades del sistema.</p>
          
          <h3 style={{ color: '#e30613', marginTop: 20, marginBottom: 10 }}>Contacto</h3>
          <p>Si necesitas ayuda adicional, puedes contactarnos a través de WhatsApp.</p>
          
          <h3 style={{ color: '#e30613', marginTop: 20, marginBottom: 10 }}>FAQ</h3>
          <p>Preguntas frecuentes y respuestas sobre el uso del sistema.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
