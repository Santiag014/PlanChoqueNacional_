/**
 * Configuración y funciones para manejar permisos de usuarios
 * Basado en la tabla users_agente que relaciona usuarios con agentes específicos
 */

import { getConnection } from '../db.js';

/**
 * Obtiene las restricciones de un usuario desde la base de datos
 * @param {number} userId - ID del usuario
 * @param {string} filterByName - Filtro opcional por nombre/descripción del agente
 * @returns {Promise<Object|null>} - Restricciones del usuario o null si no tiene
 */
export async function getUserRestrictions(userId, filterByName = null) {
  console.log('🚀 [getUserRestrictions] Iniciando para userId:', userId);
  
  if (!userId) {
    console.log('❌ [getUserRestrictions] No userId provided');
    return null;
  }

  let conn;
  try {
    conn = await getConnection();
    console.log('✅ [getUserRestrictions] Conexión a BD establecida');
    
    // Construir la consulta base - obtener nombres de empresas/agentes
    let query = 'SELECT agente.id as agente_id, agente.descripcion FROM users_agente INNER JOIN agente ON agente.id = users_agente.agente_id WHERE user_id = ?';
    let params = [userId];
    
    // Si hay filtro por nombre, agregarlo
    if (filterByName && filterByName.trim() !== '') {
      query += ' AND agente.descripcion LIKE ?';
      params.push(`%${filterByName.trim()}%`);
      console.log('🔍 [getUserRestrictions] Aplicando filtro por nombre:', filterByName);
    }
    
    console.log('🔍 [getUserRestrictions] Executing query:', query);
    console.log('📋 [getUserRestrictions] With params:', params);
    
    // Obtener los agentes asociados al usuario
    const [userAgents] = await conn.execute(query, params);
    
    console.log('📊 [getUserRestrictions] Query result:', userAgents);
    console.log('📊 [getUserRestrictions] Número de agentes encontrados:', userAgents.length);

    if (userAgents.length === 0) {
      console.log('⚠️ [getUserRestrictions] No user restrictions found for user:', userId);
      console.log('🔓 [getUserRestrictions] Usuario SIN restricciones - puede ver TODO');
      // Si no tiene restricciones específicas, puede ver todo
      return null;
    }

    // Extraer IDs y nombres de agentes para el filtrado
    const agenteIds = userAgents.map(row => row.agente_id);
    const agenteNames = userAgents.map(row => row.descripcion);
    
    console.log('🏢 [getUserRestrictions] User agente IDs:', agenteIds);
    console.log('🏢 [getUserRestrictions] User agente Names:', agenteNames);
    console.log('🔒 [getUserRestrictions] Usuario CON restricciones - solo ve empresas asignadas');

    return {
      agenteIds,
      agenteNames, // ¡IMPORTANTE! Agregar los nombres para filtrar como antes
      hasRestrictions: true
    };

  } catch (error) {
    console.error('Error obteniendo restricciones de usuario:', error);
    return null;
  } finally {
    if (conn) await conn.release();
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
  console.log('🔧 [applyUserFilters] Iniciando filtros para userId:', userId);
  console.log('🔧 [applyUserFilters] filterType:', filterType, 'agenteField:', agenteField);
  
  const restrictions = await getUserRestrictions(userId, filterByName);
  
  if (!restrictions || !restrictions.hasRestrictions) {
    console.log('🔓 [applyUserFilters] Sin restricciones - consulta original');
    // Sin restricciones, devolver consulta original
    return {
      query: baseQuery,
      params: []
    };
  }

  console.log('🔒 [applyUserFilters] Aplicando restricciones...');

  // Separar la consulta en partes más cuidadosamente
  const trimmedQuery = baseQuery.trim();
  
  // Buscar ORDER BY, GROUP BY, HAVING al final (pero no capturar todo hasta el final)
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

  console.log('🔍 [applyUserFilters] Query limpia:', cleanQuery);
  console.log('🔍 [applyUserFilters] Cláusulas finales:', finalClauses);

  // Verificar si la consulta limpia ya tiene WHERE clause
  const hasWhere = cleanQuery.toLowerCase().includes(' where ');
  const connector = hasWhere ? ' AND ' : ' WHERE ';
  
  console.log('🔍 [applyUserFilters] ¿Tiene WHERE?:', hasWhere, '| Conector:', connector);
  
  let agenteFilter;
  let filterParams;
  
  if (filterType === 'name') {
    // Filtrar por nombres de agentes (como se hacía antes en frontend)
    agenteFilter = generateAgenteNameFilter(restrictions.agenteNames, agenteField);
    filterParams = restrictions.agenteNames;
    console.log('🏷️ [applyUserFilters] Filtrando por nombres:', restrictions.agenteNames);
  } else {
    // Filtrar por IDs de agentes (por defecto) - CORREGIR campo
    const prefix = tableAlias ? `${tableAlias}.` : '';
    const fieldName = `${prefix}id_agente`; // Cambiado de agente_id a id_agente
    agenteFilter = generateAgenteFilterWithField(restrictions.agenteIds, fieldName);
    filterParams = restrictions.agenteIds;
    console.log('🆔 [applyUserFilters] Filtrando por IDs:', restrictions.agenteIds);
  }
  
  // Construir la consulta final: Query base + WHERE/AND + Filtro + Cláusulas finales
  const modifiedQuery = cleanQuery + connector + agenteFilter + (finalClauses ? ' ' + finalClauses : '');
  
  console.log('📝 [applyUserFilters] Consulta modificada:', modifiedQuery);
  console.log('📋 [applyUserFilters] Parámetros:', filterParams);

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
    console.log('🔧 [addUserRestrictions] Iniciando middleware');
    console.log('👤 [addUserRestrictions] req.user:', req.user);
    console.log('🆔 [addUserRestrictions] req.user.id:', req.user?.id);
    
    if (req.user && req.user.id) {
      console.log('✅ [addUserRestrictions] Usuario encontrado, obteniendo restricciones...');
      req.userRestrictions = await getUserRestrictions(req.user.id);
      console.log('📋 [addUserRestrictions] Restricciones obtenidas:', req.userRestrictions);
    } else {
      console.log('❌ [addUserRestrictions] No se encontró usuario o ID');
    }
    next();
  } catch (error) {
    console.error('Error en middleware de restricciones:', error);
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

  let conn;
  try {
    conn = await getConnection();
    
    // Obtener información detallada de los agentes permitidos
    const placeholders = restrictions.agenteIds.map(() => '?').join(',');
    const [agents] = await conn.execute(
      `SELECT id, name, email, phone FROM users WHERE id IN (${placeholders})`,
      restrictions.agenteIds
    );

    return agents;

  } catch (error) {
    console.error('Error obteniendo agentes permitidos:', error);
    return [];
  } finally {
    if (conn) await conn.release();
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

  let conn;
  try {
    conn = await getConnection();
    
    // Obtener agentes del usuario filtrados por nombre
    const [agents] = await conn.execute(
      `SELECT agente.id, agente.descripcion 
       FROM users_agente 
       INNER JOIN agente ON agente.id = users_agente.agente_id 
       WHERE user_id = ? AND agente.descripcion LIKE ?`,
      [userId, `%${searchName.trim()}%`]
    );

    return agents;

  } catch (error) {
    console.error('Error obteniendo agentes por nombre:', error);
    return [];
  } finally {
    if (conn) await conn.release();
  }
}
