import React from "react";
import DashboardLayout from "../components/DashboardLayout";

// Función para obtener el link de PowerBI desde el token JWT
function getPowerBILinkFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No hay token en localStorage");
      return "";
    }
    
    // Decodificar el payload del JWT
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log("Payload completo del token:", payload);
    
    // Buscar el campo del PowerBI - ajusta según el nombre en tu token
    const link = payload.powerbiLink || payload.powerbi_link || payload.link_powerbi || payload.powerBI || payload.linkPowerBI || "";
    console.log("Link de PowerBI encontrado:", link);
    
    return link;
  } catch (error) {
    console.error("Error al obtener link de PowerBI desde token:", error);
    return "";
  }
}

const MercadeoPowerBI = () => {
  const powerbiLink = getPowerBILinkFromToken();

  return (
    <DashboardLayout>
      <div style={{
        maxWidth: "100%",
        margin: "40px auto",
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "70vh"
      }}>
        <h2 style={{color: "#d6001c", marginBottom: "24px"}}>Panel Power BI Mercadeo</h2>
        {powerbiLink ? (
          <iframe
            title="Power BI Mercadeo"
            src={powerbiLink}
            style={{width: "100%", height: "600px", border: "none", borderRadius: "8px"}}
            allowFullScreen
          />
        ) : (
          <div style={{
            padding: "40px",
            textAlign: "center",
            color: "#666",
            background: "#f5f5f5",
            borderRadius: "8px",
            border: "2px dashed #ddd"
          }}>
            <p>No tienes un link de Power BI configurado.</p>
            <p>Contacta al administrador para configurar tu acceso.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MercadeoPowerBI;
