import React, { useState, useCallback } from 'react';
import { CONFIG } from '../config.js';
import './BulkUpload.css';

const BulkUpload = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Manejar drag & drop
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const droppedFile = files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setError(null);
      }
    }
  }, []);

  // Validar tipo de archivo
  const validateFile = (file) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls) o CSV.');
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('El archivo es demasiado grande. Máximo 10MB.');
      return false;
    }
    
    return true;
  };

  // Manejar selección de archivo manual
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setError(null);
    }
  };

  // Subir archivo
  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${CONFIG.API_URL}/api/bulk-upload/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setFile(null);
        // Limpiar el input file
        document.getElementById('fileInput').value = '';
      } else {
        setError(data.message || 'Error al procesar el archivo');
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Descargar plantilla
  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${CONFIG.API_URL}/api/bulk-upload/template`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_usuarios.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        setError('Error al descargar la plantilla');
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message);
    }
  };

  // Limpiar archivo seleccionado
  const clearFile = () => {
    setFile(null);
    setError(null);
    setResult(null);
    document.getElementById('fileInput').value = '';
  };

  return (
    <div className="bulk-upload-container">
      <div className="bulk-upload-header">
        <h2>📊 Carga Masiva de Usuarios</h2>
        <p>Sube un archivo Excel o CSV para crear múltiples usuarios de forma automática</p>
      </div>

      {/* Botón para descargar plantilla */}
      <div className="template-section">
        <button 
          onClick={handleDownloadTemplate}
          className="btn-download-template"
        >
          📋 Descargar Plantilla Excel
        </button>
        <small>Descarga la plantilla para conocer el formato requerido</small>
      </div>

      {/* Zona de drag & drop */}
      <div 
        className={`dropzone ${isDragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {!file ? (
          <div className="dropzone-content">
            <div className="upload-icon">📁</div>
            <p className="dropzone-text">
              Arrastra y suelta tu archivo Excel aquí<br />
              o haz clic para seleccionar
            </p>
            <input
              id="fileInput"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button 
              className="btn-select-file"
              onClick={() => document.getElementById('fileInput').click()}
            >
              Seleccionar Archivo
            </button>
          </div>
        ) : (
          <div className="file-selected">
            <div className="file-icon">📄</div>
            <div className="file-info">
              <p className="file-name">{file.name}</p>
              <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button 
              className="btn-remove-file"
              onClick={clearFile}
              title="Quitar archivo"
            >
              ❌
            </button>
          </div>
        )}
      </div>

      {/* Botón de subida */}
      {file && (
        <div className="upload-section">
          <button 
            onClick={handleUpload}
            disabled={loading}
            className="btn-upload"
          >
            {loading ? '⏳ Procesando...' : '🚀 Cargar Usuarios'}
          </button>
        </div>
      )}

      {/* Mostrar errores */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Mostrar resultados */}
      {result && (
        <div className="results-section">
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            {result.message}
          </div>
          
          <div className="results-stats">
            <div className="stat-item">
              <span className="stat-label">Usuarios creados:</span>
              <span className="stat-value">{result.data.created}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total procesados:</span>
              <span className="stat-value">{result.data.total}</span>
            </div>
          </div>

          {result.data.errors && result.data.errors.length > 0 && (
            <div className="errors-list">
              <h4>⚠️ Advertencias:</h4>
              <ul>
                {result.data.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {result.data.passwords && result.data.passwords.length > 0 && (
            <div className="passwords-section">
              <h4>🔑 Contraseñas Generadas:</h4>
              <div className="passwords-note">
                <strong>⚠️ IMPORTANTE:</strong> Guarda estas contraseñas ya que son generadas automáticamente
              </div>
              <div className="passwords-list">
                {result.data.passwords.map((user, index) => (
                  <div key={index} className="password-item">
                    <span className="user-info">{user.name} ({user.email})</span>
                    <span className="password-value">{user.password}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
