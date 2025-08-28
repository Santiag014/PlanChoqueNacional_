/**
 * Configuración y funciones para manejar permisos de usuarios
 * Basado en la tabla users_agente que relaciona usuarios con agentes específicos
 */

import { executeQuery } from '../db.js';
import logger from '../utils/logger.js';

// Cache para almacenar restricciones de usuarios temporalmente
const userRestrictionsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene las restricciones de un usuario desde la base de datos con cache
 * @param {number} userId - ID del usuario
 * @param {string} filterByName - Filtro opcional por nombre/descripción del agente
 * @returns {Promise<Object|null>} - Restricciones del usuario o null si no tiene
 */
export async function getUserRestrictions(userId, filterByName = null) {
  if (!userId) {
    logger.debug('UserID no proporcionado');
    return null;
  }

  // Verificar cache primero
  const cacheKey = `${userId}_${filterByName || ''}`;
  const cachedData = userRestrictionsCache.get(cacheKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    return cachedData.data;
  }

  try {
    // Construir la consulta base - obtener nombres de empresas/agentes
    let query = 'SELECT agente.id as agente_id, agente.descripcion FROM users_agente INNER JOIN agente ON agente.id = users_agente.agente_id WHERE user_id = ?';
    let params = [userId];
    
    // Si hay filtro por nombre, agregarlo
    if (filterByName && filterByName.trim() !== '') {
      query += ' AND agente.descripcion LIKE ?';
      params.push(`%${filterByName.trim()}%`);
    }
    
    // Usar executeQuery en lugar de conexiones manuales
    const userAgents = await executeQuery(query, params);

    if (userAgents.length === 0) {
      // Cache resultado negativo también
      userRestrictionsCache.set(cacheKey, {
        data: null,
        timestamp: Date.now()
      });
      return null;
    }

    // Extraer IDs y nombres de agentes para el filtrado
    const restrictions = {
      agenteIds: userAgents.map(row => row.agente_id),
      agenteNames: userAgents.map(row => row.descripcion),
      hasRestrictions: true
    };
    
    // Guardar en cache
    userRestrictionsCache.set(cacheKey, {
      data: restrictions,
      timestamp: Date.now()
    });

    logger.debug(`Usuario ${userId} tiene restricciones para ${restrictions.agenteIds.length} agentes`);
    return restrictions;

  } catch (error) {
    logger.error('Error obteniendo restricciones de usuario:', error.message);
    return null;
  }
}

/**
 * Genera una cláusula WHERE para filtrar por agentes permitidos
 * @param {Array} agenteIds - Array de IDs de agentes permitidos
 * @param {string} tableAlias - Alias de la tabla que contiene el campo agente_id
 * @returns {string} - Cláusula WHERE SQL
 */
export function generateAgenteFilter(agenteIds, tableAlias = '') {
  if (!agenteIds || agenteIds.length === 0) {
    return '';
  }

  const prefix = tableAlias ? `${tableAlias}.` : '';
  const placeholders = agenteIds.map(() => '?').join(',');
  
  return `${prefix}agente_id IN (${placeholders})`;
}

/**
 * Genera una cláusula WHERE para filtrar por agentes permitidos con campo específico
 * @param {Array} agenteIds - Array de IDs de agentes permitidos
 * @param {string} fieldName - Nombre completo del campo (ej: 'pv.id_agente')
 * @returns {string} - Cláusula WHERE SQL
 */
export function generateAgenteFilterWithField(agenteIds, fieldName) {
  if (!agenteIds || agenteIds.length === 0) {
    return '';
  }

  const placeholders = agenteIds.map(() => '?').join(',');
  
  return `${fieldName} IN (${placeholders})`;
}

/**
 * Genera una cláusula WHERE para filtrar por nombres de agentes (como antes en frontend)
 * @param {Array} agenteNames - Array de nombres de agentes permitidos
 * @param {string} agenteField - Campo que contiene el nombre del agente
 * @returns {string} - Cláusula WHERE SQL
 */
export function generateAgenteNameFilter(agenteNames, agenteField = 'agente') {
  if (!agenteNames || agenteNames.length === 0) {
    return '';
  }

  const conditions = agenteNames.map(() => `${agenteField} = ?`).join(' OR ');
  
  return `(${conditions})`;
}

/**
 * Aplica filtros de usuario a una consulta SQL
 * @param {string} baseQuery - Consulta SQL base
 * @param {number} userId - ID del usuario
 * @param {string} tableAlias - Alias de la tabla principal (opcional)
 * @param {string} filterByName - Filtro opcional por nombre del agente
 * @param {string} filterType - Tipo de filtro: 'id' (por agente_id) o 'name' (por nombre)
 * @param {string} agenteField - Campo de agente para filtro por nombre (ej: 'agente')
 * @returns {Promise<Object>} - { query, params } con la consulta modificada y parámetros
 */
export async function applyUserFilters(baseQuery, userId, tableAlias = '', filterByName = null, filterType = 'id', agenteField = 'agente') {
  const restrictions = await getUserRestrictions(userId, filterByName);
  
  if (!restrictions || !restrictions.hasRestrictions) {
    // Sin restricciones, devolver consulta original
    return {
      query: baseQuery,
      params: []
    };
  }

  // Separar la consulta en partes más cuidadosamente
  const trimmedQuery = baseQuery.trim();
  
  // Buscar ORDER BY, GROUP BY, HAVING al final
  const orderByMatch = trimmedQuery.match(/\s+ORDER\s+BY\s+[^;]+?(?=\s*$)/i);
  const groupByMatch = trimmedQuery.match(/\s+GROUP\s+BY\s+[^;]+?(?=\s+ORDER|\s*$)/i);
  const havingMatch = trimmedQuery.match(/\s+HAVING\s+[^;]+?(?=\s+ORDER|\s*$)/i);
  
  // Extraer y remover las cláusulas finales paso a paso
  let cleanQuery = trimmedQuery;
  let finalClauses = '';
  
  // Remover ORDER BY primero
  if (orderByMatch) {
    finalClauses = orderByMatch[0];
    cleanQuery = cleanQuery.replace(orderByMatch[0], '').trim();
  }
  
  // Luego remover GROUP BY
  if (groupByMatch) {
    finalClauses = groupByMatch[0] + (finalClauses ? ' ' + finalClauses : '');
    cleanQuery = cleanQuery.replace(groupByMatch[0], '').trim();
  }
  
  // Finalmente remover HAVING
  if (havingMatch) {
    finalClauses = havingMatch[0] + (finalClauses ? ' ' + finalClauses : '');
    cleanQuery = cleanQuery.replace(havingMatch[0], '').trim();
  }

  // Verificar si la consulta limpia ya tiene WHERE clause
  const hasWhere = cleanQuery.toLowerCase().includes(' where ');
  const connector = hasWhere ? ' AND ' : ' WHERE ';
  
  let agenteFilter;
  let filterParams;
  
  if (filterType === 'name') {
    // Filtrar por nombres de agentes
    agenteFilter = generateAgenteNameFilter(restrictions.agenteNames, agenteField);
    filterParams = restrictions.agenteNames;
  } else {
    // Filtrar por IDs de agentes (por defecto)
    const prefix = tableAlias ? `${tableAlias}.` : '';
    const fieldName = `${prefix}id_agente`;
    agenteFilter = generateAgenteFilterWithField(restrictions.agenteIds, fieldName);
    filterParams = restrictions.agenteIds;
  }
  
  // Construir la consulta final
  const modifiedQuery = cleanQuery + connector + agenteFilter + (finalClauses ? ' ' + finalClauses : '');

  return {
    query: modifiedQuery,
    params: filterParams
  };
}

/**
 * Middleware para agregar restricciones de usuario a req object
 */
export const addUserRestrictions = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      req.userRestrictions = await getUserRestrictions(req.user.id);
    }
    next();
  } catch (error) {
    logger.error('Error en middleware de restricciones:', error.message);
    next();
  }
};

/**
 * Obtiene información detallada de los agentes permitidos para un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<Array>} - Array con información de los agentes
 */
export async function getUserAllowedAgents(userId) {
  const restrictions = await getUserRestrictions(userId);
  
  if (!restrictions || !restrictions.hasRestrictions) {
    return []; // Sin restricciones específicas
  }

  try {
    // Obtener información detallada de los agentes permitidos
    const placeholders = restrictions.agenteIds.map(() => '?').join(',');
    const agents = await executeQuery(
      `SELECT id, descripcion FROM agente WHERE id IN (${placeholders})`,
      restrictions.agenteIds
    );

    return agents;

  } catch (error) {
    logger.error('Error obteniendo agentes permitidos:', error.message);
    return [];
  }
}

/**
 * Obtiene agentes filtrados por nombre para un usuario específico
 * @param {number} userId - ID del usuario
 * @param {string} searchName - Nombre o parte del nombre a buscar
 * @returns {Promise<Array>} - Array con los agentes que coinciden con el nombre
 */
export async function getUserAgentsByName(userId, searchName) {
  if (!userId || !searchName) return [];

  try {
    // Obtener agentes del usuario filtrados por nombre
    const agents = await executeQuery(
      `SELECT agente.id, agente.descripcion 
       FROM users_agente 
       INNER JOIN agente ON agente.id = users_agente.agente_id 
       WHERE user_id = ? AND agente.descripcion LIKE ?`,
      [userId, `%${searchName.trim()}%`]
    );

    return agents;

  } catch (error) {
    logger.error('Error buscando agentes por nombre:', error.message);
    return [];
  }
}

// Función para limpiar cache (útil cuando se actualizan permisos)
export function clearUserRestrictionsCache(userId = null) {
  if (userId) {
    // Limpiar cache específico del usuario
    const keysToDelete = Array.from(userRestrictionsCache.keys()).filter(key => key.startsWith(`${userId}_`));
    keysToDelete.forEach(key => userRestrictionsCache.delete(key));
  } else {
    // Limpiar todo el cache
    userRestrictionsCache.clear();
  }
}
