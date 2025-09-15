import React from "react";
import DashboardLayout from "../../components/DashboardLayout";
import PowerBIViewer from "../../components/PowerBIViewer";

const OTPowerBI = () => {
  console.log("🏢 OTPowerBI (OrganizacionTerpel) - Página cargada");
  
  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) {
          .powerbi-container {
            height: calc(100vh - 120px) !important;
            padding: 8px !important;
            margin: 10px auto !important;
          }
          .powerbi-title {
            font-size: 20px !important;
            margin-bottom: 8px !important;
          }
        }
        @media (max-width: 480px) {
          .powerbi-container {
            height: calc(100vh - 100px) !important;
            width: 98% !important;
          }
        }
      `}</style>
      
      <div 
        className="powerbi-container"
        style={{
          width: "95%",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "calc(100vh - 120px)", // Altura dinámica basada en el viewport
          boxSizing: "border-box"
        }}
      > 
        <PowerBIViewer 
          title="Power BI Organización Terpel"
          height="calc(100vh - 180px)" // Altura dinámica que se ajusta al contenido
          width="100%"
          containerStyle={{
            width: "100%",
            height: "calc(100vh - 180px)",
            flex: 1,
            display: "flex",
            flexDirection: "column"
          }}
          iframeStyle={{
            flex: 1,
            minHeight: "400px"
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default OTPowerBI;
