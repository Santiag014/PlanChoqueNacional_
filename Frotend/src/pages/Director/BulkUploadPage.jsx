import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import BulkUpload from '../../components/BulkUpload';

const BulkUploadPage = () => {
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <h1>Gestión de Usuarios</h1>
          <nav className="breadcrumb">
            <span>Director</span>
            <span>›</span>
            <span>Carga Masiva</span>
          </nav>
        </div>
        
        <div className="page-content">
          <BulkUpload />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BulkUploadPage;
