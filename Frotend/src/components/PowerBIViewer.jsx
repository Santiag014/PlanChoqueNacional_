import React from 'react';
import { usePowerBI } from '../hooks/usePowerBI';

/**
 * Componente reutilizable para mostrar un iframe de PowerBI
 * Obtiene automáticamente el enlace del usuario autenticado
 */
const PowerBIViewer = ({ 
  title = "Panel Power BI", 
  height = "600px", 
  width = "100%",
  containerStyle = {},
  iframeStyle = {}
}) => {
  console.log("🔧 PowerBIViewer - Iniciando componente");
  const { powerbiLink, loading, error } = usePowerBI();
  
  console.log("🔧 PowerBIViewer - Estado actual:", { powerbiLink, loading, error });

  if (loading) {
    return (
      <div style={{
        padding: "40px",
        textAlign: "center",
        background: "#f5f5f5",
        borderRadius: "8px",
        border: "2px dashed #ddd",
        ...containerStyle
      }}>
        <div style={{ 
          display: 'inline-block',
          width: '32px',
          height: '32px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #d6001c',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p style={{ color: "#666", margin: 0 }}>Cargando Power BI...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: "40px",
        textAlign: "center",
        color: "#d32f2f",
        background: "#ffebee",
        borderRadius: "8px",
        border: "2px solid #ffcdd2",
        ...containerStyle
      }}>
        <h3 style={{ color: "#d32f2f", marginBottom: "16px" }}>Error al cargar Power BI</h3>
        <p style={{ margin: 0 }}>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            background: "#d6001c",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!powerbiLink) {
    console.log("❌ PowerBIViewer - No hay enlace de PowerBI disponible");
    return (
      <div style={{
        padding: "40px",
        textAlign: "center",
        color: "#666",
        background: "#f5f5f5",
        borderRadius: "8px",
        border: "2px dashed #ddd",
        ...containerStyle
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
        <h3 style={{ color: "#666", marginBottom: "16px" }}>No tienes acceso a Power BI</h3>
        <p style={{ margin: 0, marginBottom: "16px" }}>
          Tu usuario no tiene un enlace de Power BI configurado.<br/>
          Contacta al administrador para obtener acceso.
        </p>
        <div style={{ 
          fontSize: "12px", 
          color: "#999", 
          padding: "8px", 
          background: "#f9f9f9", 
          borderRadius: "4px",
          marginTop: "16px"
        }}>
          <strong>Info de depuración:</strong><br/>
          Loading: {loading ? "Sí" : "No"}<br/>
          Error: {error || "Ninguno"}<br/>
          Link: {powerbiLink || "Vacío"}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%",
      height: height || "calc(100vh - 200px)",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      ...containerStyle
    }}>
      <iframe
        title={title}
        src={powerbiLink}
        style={{
          width: width,
          height: "100%",
          border: "none",
          borderRadius: "8px",
          flex: 1,
          minHeight: "400px",
          ...iframeStyle
        }}
        allowFullScreen
      />
    </div>
  );
};

export default PowerBIViewer;
