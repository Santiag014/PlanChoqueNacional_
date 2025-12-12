-- =====================================================
-- CONSULTA SQL: BONO "EJECUCIÓN PERFECTA"
-- =====================================================
-- Obtiene asesores que lograron 100% en Cobertura Y Frecuencia
-- Se ejecuta después del fin del periodo: 2025-12-15
-- =====================================================

-- Variable de fecha límite para implementación
SET @fecha_limite_implementacion = '2025-12-20';

-- =====================================================
-- CONSULTA PRINCIPAL: EJECUCIÓN PERFECTA (FIN DE PERIODO)
-- =====================================================

WITH asesores_con_pdvs AS (
  -- Paso 1: Obtener todos los asesores con sus PDVs asignados
  SELECT 
    u.id AS asesor_id,
    u.name AS asesor_nombre,
    u.email AS asesor_email,
    COUNT(pv.id) AS total_asignados
  FROM users u
  LEFT JOIN puntos_venta pv ON pv.user_id = u.id
  WHERE u.rol_id = 1
  GROUP BY u.id, u.name, u.email
  HAVING COUNT(pv.id) > 0
),

cobertura_por_asesor AS (
  -- Paso 2: Calcular cobertura (PDVs implementados)
  SELECT 
    acp.asesor_id,
    acp.asesor_nombre,
    acp.asesor_email,
    acp.total_asignados,
    COUNT(DISTINCT rs.pdv_id) AS total_implementados,
    ROUND((COUNT(DISTINCT rs.pdv_id) / acp.total_asignados) * 100, 2) AS porcentaje_cobertura,
    CASE 
      WHEN COUNT(DISTINCT rs.pdv_id) >= acp.total_asignados THEN 1 
      ELSE 0 
    END AS cobertura_ok
  FROM asesores_con_pdvs acp
  LEFT JOIN registro_servicios rs ON rs.user_id = acp.asesor_id 
    AND rs.estado_id = 2 
    AND rs.estado_agente_id = 2 
    AND rs.fecha_registro <= @fecha_limite_implementacion
  GROUP BY acp.asesor_id, acp.asesor_nombre, acp.asesor_email, acp.total_asignados
),

frecuencia_por_asesor AS (
  -- Paso 3: Calcular frecuencia (visitas únicas por PDV por día) - SIN LÍMITE DE FECHA
  SELECT 
    acp.asesor_id,
    acp.total_asignados,
    (acp.total_asignados * 10) AS meta_frecuencia,
    COUNT(DISTINCT CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro))) AS real_frecuencia,
    ROUND((COUNT(DISTINCT CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro))) / (acp.total_asignados * 10)) * 100, 2) AS porcentaje_frecuencia,
    CASE 
      WHEN COUNT(DISTINCT CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro))) >= (acp.total_asignados * 10) THEN 1 
      ELSE 0 
    END AS frecuencia_ok
  FROM asesores_con_pdvs acp
  LEFT JOIN registro_servicios rs ON rs.user_id = acp.asesor_id 
    AND rs.estado_id = 2 
    AND rs.estado_agente_id = 2
    -- ⚠️ NOTA: NO se filtra por fecha - cuenta TODO el historial de visitas
  GROUP BY acp.asesor_id, acp.total_asignados
),

ejecucion_perfecta AS (
  -- Paso 4: Combinar cobertura y frecuencia
  SELECT 
    c.asesor_id,
    c.asesor_nombre,
    c.asesor_email,
    c.total_asignados,
    c.total_implementados,
    c.porcentaje_cobertura,
    c.cobertura_ok,
    f.meta_frecuencia,
    f.real_frecuencia,
    f.porcentaje_frecuencia,
    f.frecuencia_ok,
    CASE 
      WHEN c.cobertura_ok = 1 AND f.frecuencia_ok = 1 THEN 1 
      ELSE 0 
    END AS califica_bono
  FROM cobertura_por_asesor c
  INNER JOIN frecuencia_por_asesor f ON f.asesor_id = c.asesor_id
)

-- Paso 5: Seleccionar solo los que califican para el bono
SELECT 
  asesor_id,
  asesor_nombre,
  asesor_email,
  total_asignados,
  total_implementados,
  porcentaje_cobertura,
  meta_frecuencia,
  real_frecuencia,
  porcentaje_frecuencia,
  1000 AS puntos_bono,
  'Ejecución Perfecta' AS descripcion_bono,
  'Logra 100% en Cobertura y Frecuencia para 1.000 pts extra.' AS detalle_bono,
  NOW() AS fecha_asignacion
FROM ejecucion_perfecta
WHERE califica_bono = 1
ORDER BY asesor_nombre;


-- =====================================================
-- CONSULTA SIMPLIFICADA (SIN CTEs)
-- =====================================================

SELECT 
  u.id AS asesor_id,
  u.name AS asesor_nombre,
  u.email AS asesor_email,
  COUNT(DISTINCT pv.id) AS total_asignados,
  COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= @fecha_limite_implementacion 
    THEN rs.pdv_id 
  END) AS total_implementados,
  ROUND((COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= @fecha_limite_implementacion 
    THEN rs.pdv_id 
  END) / COUNT(DISTINCT pv.id)) * 100, 2) AS porcentaje_cobertura,
  (COUNT(DISTINCT pv.id) * 10) AS meta_frecuencia,
  COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 AND rs.estado_agente_id = 2 
    THEN CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro)) 
  END) AS real_frecuencia,
  ROUND((COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 AND rs.estado_agente_id = 2 
    THEN CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro)) 
  END) / (COUNT(DISTINCT pv.id) * 10)) * 100, 2) AS porcentaje_frecuencia,
  1000 AS puntos_bono,
  'Ejecución Perfecta' AS descripcion_bono
FROM users u
INNER JOIN puntos_venta pv ON pv.user_id = u.id
LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.user_id = u.id
WHERE u.rol_id = 1
GROUP BY u.id, u.name, u.email
HAVING COUNT(DISTINCT pv.id) > 0 
  AND COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= @fecha_limite_implementacion 
    THEN rs.pdv_id 
  END) >= COUNT(DISTINCT pv.id)
  AND COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 AND rs.estado_agente_id = 2 
    THEN CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro)) 
  END) >= (COUNT(DISTINCT pv.id) * 10)
ORDER BY asesor_nombre;


-- =====================================================
-- CONSULTA PARA VER TODOS LOS ASESORES (DETALLADO)
-- (Incluye los que NO califican)
-- =====================================================

SELECT 
  u.id AS asesor_id,
  u.name AS asesor_nombre,
  u.email AS asesor_email,
  COUNT(DISTINCT pv.id) AS total_asignados,
  COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= @fecha_limite_implementacion 
    THEN rs.pdv_id 
  END) AS total_implementados,
  ROUND((COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= @fecha_limite_implementacion 
    THEN rs.pdv_id 
  END) / COUNT(DISTINCT pv.id)) * 100, 2) AS porcentaje_cobertura,
  CASE 
    WHEN COUNT(DISTINCT CASE 
      WHEN rs.estado_id = 2 
        AND rs.estado_agente_id = 2 
        AND rs.fecha_registro <= @fecha_limite_implementacion 
      THEN rs.pdv_id 
    END) >= COUNT(DISTINCT pv.id) THEN '✓ CUMPLE' 
    ELSE '✗ NO CUMPLE'
  END AS estado_cobertura,
  (COUNT(DISTINCT pv.id) * 10) AS meta_frecuencia,
  COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 AND rs.estado_agente_id = 2 
    THEN CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro)) 
  END) AS real_frecuencia,
  ROUND((COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 AND rs.estado_agente_id = 2 
    THEN CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro)) 
  END) / (COUNT(DISTINCT pv.id) * 10)) * 100, 2) AS porcentaje_frecuencia,
  CASE 
    WHEN COUNT(DISTINCT CASE 
      WHEN rs.estado_id = 2 AND rs.estado_agente_id = 2 
      THEN CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro)) 
    END) >= (COUNT(DISTINCT pv.id) * 10) THEN '✓ CUMPLE' 
    ELSE '✗ NO CUMPLE'
  END AS estado_frecuencia,
  CASE 
    WHEN COUNT(DISTINCT CASE 
      WHEN rs.estado_id = 2 
        AND rs.estado_agente_id = 2 
        AND rs.fecha_registro <= @fecha_limite_implementacion 
      THEN rs.pdv_id 
    END) >= COUNT(DISTINCT pv.id)
    AND COUNT(DISTINCT CASE 
      WHEN rs.estado_id = 2 AND rs.estado_agente_id = 2 
      THEN CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro)) 
    END) >= (COUNT(DISTINCT pv.id) * 10)
    THEN '🏆 SI - EJECUCIÓN PERFECTA'
    ELSE '✗ NO CALIFICA'
  END AS califica_bono
FROM users u
INNER JOIN puntos_venta pv ON pv.user_id = u.id
LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.user_id = u.id
WHERE u.rol_id = 1
GROUP BY u.id, u.name, u.email
HAVING COUNT(DISTINCT pv.id) > 0
ORDER BY califica_bono DESC, porcentaje_cobertura DESC, porcentaje_frecuencia DESC;


-- =====================================================
-- CONSULTA PARA VERIFICAR SI YA EXISTE EL BONO
-- =====================================================

SELECT 
  rb.id,
  rb.id_asesor,
  u.name AS asesor_nombre,
  rb.puntos,
  rb.descripcion,
  rb.detalle,
  rb.created
FROM retos_bonificadores rb
INNER JOIN users u ON u.id = rb.id_asesor
WHERE rb.descripcion = 'Ejecución Perfecta'
ORDER BY rb.created ASC;


-- =====================================================
-- CONSULTA DE DIAGNÓSTICO: Ver desglose por asesor
-- =====================================================

SELECT 
  u.id AS asesor_id,
  u.name AS asesor_nombre,
  COUNT(DISTINCT pv.id) AS total_asignados,
  COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= @fecha_limite_implementacion 
    THEN rs.pdv_id 
  END) AS total_implementados,
  COUNT(DISTINCT pv.id) - COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= @fecha_limite_implementacion 
    THEN rs.pdv_id 
  END) AS pdvs_faltantes_cobertura,
  (COUNT(DISTINCT pv.id) * 10) AS meta_frecuencia,
  COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 AND rs.estado_agente_id = 2 
    THEN CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro)) 
  END) AS real_frecuencia,
  (COUNT(DISTINCT pv.id) * 10) - COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 AND rs.estado_agente_id = 2 
    THEN CONCAT(rs.pdv_id, '-', DATE(rs.fecha_registro)) 
  END) AS visitas_faltantes_frecuencia
FROM users u
INNER JOIN puntos_venta pv ON pv.user_id = u.id
LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.user_id = u.id
WHERE u.rol_id = 1
GROUP BY u.id, u.name
HAVING COUNT(DISTINCT pv.id) > 0
ORDER BY pdvs_faltantes_cobertura ASC, visitas_faltantes_frecuencia ASC;
