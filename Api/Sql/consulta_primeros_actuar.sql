-- =====================================================
-- CONSULTA SQL: BONO "PRIMEROS EN ACTUAR"
-- =====================================================
-- Obtiene los primeros 10 asesores que lograron 100% de cobertura
-- antes del 2025-09-06, ordenados por fecha de completado
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

pdvs_implementados AS (
  -- Paso 2: Obtener PDVs implementados por cada asesor antes del 2025-09-06
  SELECT 
    rs.user_id AS asesor_id,
    rs.pdv_id,
    MIN(rs.fecha_registro) AS primera_fecha_registro
  FROM registro_servicios rs
  WHERE rs.estado_id = 2 
    AND rs.estado_agente_id = 2 
    AND rs.fecha_registro <= '2025-09-06'
  GROUP BY rs.user_id, rs.pdv_id
),

asesores_con_implementacion AS (
  -- Paso 3: Contar PDVs implementados por asesor
  SELECT 
    pi.asesor_id,
    COUNT(DISTINCT pi.pdv_id) AS total_implementados,
    MAX(pi.primera_fecha_registro) AS fecha_ultimo_pdv_implementado
  FROM pdvs_implementados pi
  GROUP BY pi.asesor_id
),

asesores_100_cobertura AS (
  -- Paso 4: Filtrar solo asesores con 100% de cobertura
  SELECT 
    acp.asesor_id,
    acp.asesor_nombre,
    acp.asesor_email,
    acp.total_asignados,
    aci.total_implementados,
    aci.fecha_ultimo_pdv_implementado AS fecha_completado,
    ROUND((aci.total_implementados / acp.total_asignados) * 100, 2) AS porcentaje_cobertura
  FROM asesores_con_pdvs acp
  INNER JOIN asesores_con_implementacion aci ON aci.asesor_id = acp.asesor_id
  WHERE aci.total_implementados >= acp.total_asignados
)

-- Paso 5: Seleccionar los primeros 10 ordenados por fecha de completado
SELECT 
  asesor_id,
  asesor_nombre,
  asesor_email,
  total_asignados,
  total_implementados,
  porcentaje_cobertura,
  fecha_completado,
  2000 AS puntos_bono,
  'Primeros en Actuar' AS descripcion_bono,
  CONCAT('Uno de los primeros 10 asesores en lograr 100% de cobertura antes del 06/09/2025 (', 
         total_implementados, '/', total_asignados, ' PDV).') AS detalle_bono,
  ROW_NUMBER() OVER (ORDER BY fecha_completado ASC) AS posicion_ranking
FROM asesores_100_cobertura
ORDER BY fecha_completado ASC
LIMIT 10;


-- =====================================================
-- CONSULTA SIMPLIFICADA (SIN CTEs) - MÁS COMPACTA
-- =====================================================

SELECT 
  u.id AS asesor_id,
  u.name AS asesor_nombre,
  u.email AS asesor_email,
  COUNT(DISTINCT pv.id) AS total_asignados,
  COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= '2025-09-06' 
    THEN rs.pdv_id 
  END) AS total_implementados,
  ROUND((COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= '2025-09-06' 
    THEN rs.pdv_id 
  END) / COUNT(DISTINCT pv.id)) * 100, 2) AS porcentaje_cobertura,
  MAX(CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= '2025-09-06' 
    THEN rs.fecha_registro 
  END) AS fecha_completado,
  2000 AS puntos_bono,
  'Primeros en Actuar' AS descripcion_bono
FROM users u
INNER JOIN puntos_venta pv ON pv.user_id = u.id
LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.user_id = u.id
WHERE u.rol_id = 1
GROUP BY u.id, u.name, u.email
HAVING COUNT(DISTINCT pv.id) > 0 
  AND COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= '2025-09-06' 
    THEN rs.pdv_id 
  END) >= COUNT(DISTINCT pv.id)
ORDER BY fecha_completado ASC
LIMIT 10;


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
WHERE rb.descripcion = 'Primeros en Actuar'
ORDER BY rb.created ASC;


-- =====================================================
-- CONSULTA PARA VER TODOS LOS ASESORES CON COBERTURA
-- (Incluye los que NO alcanzaron el top 10)
-- =====================================================

SELECT 
  u.id AS asesor_id,
  u.name AS asesor_nombre,
  COUNT(DISTINCT pv.id) AS total_asignados,
  COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= '2025-09-06' 
    THEN rs.pdv_id 
  END) AS total_implementados,
  ROUND((COUNT(DISTINCT CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= '2025-09-06' 
    THEN rs.pdv_id 
  END) / COUNT(DISTINCT pv.id)) * 100, 2) AS porcentaje_cobertura,
  MAX(CASE 
    WHEN rs.estado_id = 2 
      AND rs.estado_agente_id = 2 
      AND rs.fecha_registro <= '2025-09-06' 
    THEN rs.fecha_registro 
  END) AS fecha_completado,
  CASE 
    WHEN COUNT(DISTINCT CASE 
      WHEN rs.estado_id = 2 
        AND rs.estado_agente_id = 2 
        AND rs.fecha_registro <= '2025-09-06' 
      THEN rs.pdv_id 
    END) >= COUNT(DISTINCT pv.id) THEN 'SI - 100% COBERTURA'
    ELSE CONCAT('NO - ', ROUND((COUNT(DISTINCT CASE 
      WHEN rs.estado_id = 2 
        AND rs.estado_agente_id = 2 
        AND rs.fecha_registro <= '2025-09-06' 
      THEN rs.pdv_id 
    END) / COUNT(DISTINCT pv.id)) * 100, 2), '% COBERTURA')
  END AS califica_bono,
  ROW_NUMBER() OVER (
    ORDER BY 
      CASE 
        WHEN COUNT(DISTINCT CASE 
          WHEN rs.estado_id = 2 
            AND rs.estado_agente_id = 2 
            AND rs.fecha_registro <= '2025-09-06' 
          THEN rs.pdv_id 
        END) >= COUNT(DISTINCT pv.id) THEN 0
        ELSE 1
      END,
      MAX(CASE 
        WHEN rs.estado_id = 2 
          AND rs.estado_agente_id = 2 
          AND rs.fecha_registro <= '2025-09-06' 
        THEN rs.fecha_registro 
      END) ASC
  ) AS posicion_general
FROM users u
INNER JOIN puntos_venta pv ON pv.user_id = u.id
LEFT JOIN registro_servicios rs ON rs.pdv_id = pv.id AND rs.user_id = u.id
WHERE u.rol_id = 1
GROUP BY u.id, u.name
HAVING COUNT(DISTINCT pv.id) > 0
ORDER BY califica_bono DESC, fecha_completado ASC;
