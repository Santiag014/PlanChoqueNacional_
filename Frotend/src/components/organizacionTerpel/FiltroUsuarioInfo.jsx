import React from 'react';
import { useUserPermissions } from '../../hooks/ot/useUserPermissions';
import '../../styles/OrganizacionTerpel/filtro-usuario-info.css';

/**
 * Componente para mostrar información sobre filtros de usuario aplicados
 * Solo se muestra cuando el usuario tiene restricciones activas
 */
export default function FiltroUsuarioInfo() {
  const { userPermissions, loading } = useUserPermissions();

  // No mostrar nada si está cargando o no hay restricciones
  if (loading || !userPermissions?.hasRestrictions) {
    return null;
  }

  return (
    <div className="filtro-usuario-info">
      <div className="filtro-usuario-header">
        <span className="filtro-usuario-icon">🔒</span>
        <h4>Filtros de Usuario Activos</h4>
      </div>
      
      <div className="filtro-usuario-content">
        <p className="filtro-usuario-description">
          Los datos mostrados están filtrados según tus permisos de acceso.
          Tienes acceso a {userPermissions.allowedAgents?.length || 0} agente(s) comercial(es).
        </p>
        
        <div className="filtro-usuario-companies">
          <strong>Agentes permitidos:</strong>
          <div className="companies-list">
            {userPermissions.allowedAgents?.map((agent, index) => (
              <span key={index} className="company-tag">
                {agent.name}
              </span>
            ))}
          </div>
        </div>
        
        <p className="filtro-usuario-note">
          📊 Los datos están filtrados automáticamente en el servidor
        </p>
      </div>
    </div>
  );
}
