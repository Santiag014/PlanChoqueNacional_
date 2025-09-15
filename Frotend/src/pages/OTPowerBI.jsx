import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import PowerBIViewer from "../components/PowerBIViewer";

const OTPowerBI = () => {
  console.log("🏢 OTPowerBI - Página cargada");
  
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
          margin: "20px auto",
          borderRadius: "16px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "calc(100vh - 100px)",
          boxSizing: "border-box"
        }}
      >
        <h2 
          className="powerbi-title"
          style={{
            color: "#d6001c", 
            marginBottom: "16px",
            textAlign: "center",
            fontSize: "28px",
            fontWeight: "600",
            margin: "0 0 16px 0"
          }}
        >
          Panel Power BI - Organización Terpel
        </h2>
        
        <PowerBIViewer 
          title="Power BI Organización Terpel"
          height="calc(100vh - 180px)"
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
