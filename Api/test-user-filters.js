/**
 * Script de prueba para verificar el nuevo sistema de filtrado por usuario
 * Ejecutar desde el directorio Api: node test-user-filters.js
 */

import { getUserRestrictions, applyUserFilters } from './config/userPermissions.js';

async function testUserFilters() {
  console.log('🧪 Testing sistema de filtrado de usuarios\n');

  // Test 1: Usuario sin restricciones
  console.log('Test 1: Usuario sin restricciones (ej: usuario admin)');
  const userWithoutRestrictions = await getUserRestrictions(999); // Usuario que no existe en users_agente
  console.log('Resultado:', userWithoutRestrictions);
  console.log('✅ Debería ser null (sin restricciones)\n');

  // Test 2: Usuario con restricciones
  console.log('Test 2: Usuario con restricciones (ej: usuario 285)');
  const userWithRestrictions = await getUserRestrictions(285);
  console.log('Resultado:', userWithRestrictions);
  console.log('✅ Debería mostrar { agenteIds: [...], hasRestrictions: true }\n');

  // Test 3: Aplicar filtros a una consulta
  console.log('Test 3: Aplicar filtros a consulta SQL');
  const baseQuery = `
    SELECT pv.id, pv.codigo, pv.descripcion 
    FROM puntos_venta pv 
    INNER JOIN users u ON u.id = pv.user_id
    ORDER BY pv.codigo
  `;
  
  const { query: filteredQuery, params } = await applyUserFilters(baseQuery, 285, 'pv');
  console.log('Query original:', baseQuery);
  console.log('Query filtrada:', filteredQuery);
  console.log('Parámetros:', params);
  console.log('✅ Debería agregar cláusula WHERE con filtro por agente_id\n');

  // Test 4: Query que ya tiene WHERE
  console.log('Test 4: Query con WHERE existente');
  const queryWithWhere = `
    SELECT pv.id, pv.codigo 
    FROM puntos_venta pv 
    WHERE pv.activo = 1
  `;
  
  const { query: filteredQueryWhere, params: paramsWhere } = await applyUserFilters(queryWithWhere, 285, 'pv');
  console.log('Query original:', queryWithWhere);
  console.log('Query filtrada:', filteredQueryWhere);
  console.log('Parámetros:', paramsWhere);
  console.log('✅ Debería agregar AND en lugar de WHERE\n');

  console.log('🎉 Tests completados!');
}

// Ejecutar tests
testUserFilters().catch(console.error);
