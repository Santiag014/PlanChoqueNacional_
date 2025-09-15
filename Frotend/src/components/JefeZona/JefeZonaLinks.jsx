import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJefeZona } from '../../hooks/jefe-zona/useJefeZona';
import '../../styles/JefeZona/jefe-zona-links.css';

/**
 * Componente que muestra enlaces específicos para Jefe de Zona
 * Solo se muestra si el usuario tiene el rol de Jefe de Zona
 */
export default function JefeZonaLinks() {
  const navigate = useNavigate();
  const { esJefeZona, verificarJefeZona, empresasAsignadas, loading } = useJefeZona();
  const [mostrarLinks, setMostrarLinks] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      await verificarJefeZona();
    };
    verificar();
  }, []);

  useEffect(() => {
    if (esJefeZona) {
      setMostrarLinks(true);
    }
  }, [esJefeZona]);

  // No mostrar nada si está cargando o no es jefe de zona
  if (loading || !mostrarLinks) {
    return null;
  }

  return (
    <div className="jefe-zona-links-container">
      
    </div>
  );
}
