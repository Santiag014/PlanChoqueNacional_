-- =====================================================
-- CONSULTA SQL: BONO "CAMPEÓN POR AGENTE"
-- =====================================================
-- Obtiene el asesor con más galones vendidos por agente (mensual)
-- Se ejecuta el primer día de cada mes para el mes anterior
-- =====================================================

-- Variables del periodo (ejemplo: Noviembre 2025)
SET @mes_anterior_inicio = '2025-11-01';
SET @mes_anterior_fin = '2025-11-30';
SET @nombre_mes = 'Noviembre';
SET @anio = 2025;

-- =====================================================
-- CONSULTA PRINCIPAL: CAMPEÓN POR AGENTE (MENSUAL)
-- =====================================================

WITH volumen_por_asesor AS (
  -- Paso 1: Calcular volumen total por asesor en el periodo
  SELECT 
    u.id AS asesor_id,
    u.name AS asesor_nombre,
    u.email AS asesor_email,
    u.agente_id,
    ag.descripcion AS agente_nombre,
    COALESCE(SUM(rp.conversion_galonaje), 0) AS total_volumen,
    COUNT(DISTINCT rs.id) AS total_registros,
    COUNT(DISTINCT rs.pdv_id) AS pdvs_visitados
  FROM users u
  INNER JOIN agente ag ON ag.id = u.agente_id
  LEFT JOIN registro_servicios rs ON rs.user_id = u.id 
    AND rs.fecha_registro BETWEEN @mes_anterior_inicio AND @mes_anterior_fin
    AND rs.estado_id = 2 
    AND rs.estado_agente_id = 2
  LEFT JOIN registro_productos rp ON rp.registro_id = rs.id
  WHERE u.rol_id = 1 
    AND u.agente_id IS NOT NULL
  GROUP BY u.id, u.name, u.email, u.agente_id, ag.descripcion
),

ranking_por_agente AS (
  -- Paso 2: Crear ranking dentro de cada agente
  SELECT 
    asesor_id,
    asesor_nombre,
    asesor_email,
    agente_id,
    agente_nombre,
    total_volumen,
    total_registros,
    pdvs_visitados,
    ROW_NUMBER() OVER (PARTITION BY agente_id ORDER BY total_volumen DESC) AS posicion_agente
  FROM volumen_por_asesor
  WHERE total_volumen > 0
)

-- Paso 3: Seleccionar solo los campeones (posición 1 de cada agente)
SELECT 
  asesor_id,
  asesor_nombre,
  asesor_email,
  agente_id,
  agente_nombre,
  total_volumen,
  total_registros,
  pdvs_visitados,
  1000 AS puntos_bono,
  CONCAT('Campeón por Agente - ', @nombre_mes, ' ', @anio) AS descripcion_bono,
  'Más galones vendidos en tu zona, 1.000 pts extra.' AS detalle_bono,
  NOW() AS fecha_asignacion
FROM ranking_por_agente
WHERE posicion_agente = 1
ORDER BY agente_nombre, total_volumen DESC;


-- =====================================================
-- CONSULTA SIMPLIFICADA (SIN CTEs)
-- =====================================================

SELECT 
  u.id AS asesor_id,
  u.name AS asesor_nombre,
  u.email AS asesor_email,
  u.agente_id,
  ag.descripcion AS agente_nombre,
  COALESCE(SUM(rp.conversion_galonaje), 0) AS total_volumen,
  COUNT(DISTINCT rs.id) AS total_registros,
  COUNT(DISTINCT rs.pdv_id) AS pdvs_visitados,
  1000 AS puntos_bono,
  CONCAT('Campeón por Agente - ', @nombre_mes, ' ', @anio) AS descripcion_bono
FROM users u
INNER JOIN agente ag ON ag.id = u.agente_id
LEFT JOIN registro_servicios rs ON rs.user_id = u.id 
  AND rs.fecha_registro BETWEEN @mes_anterior_inicio AND @mes_anterior_fin
  AND rs.estado_id = 2 
  AND rs.estado_agente_id = 2
LEFT JOIN registro_productos rp ON rp.registro_id = rs.id
WHERE u.rol_id = 1 
  AND u.agente_id IS NOT NULL
GROUP BY u.id, u.name, u.email, u.agente_id, ag.descripcion
HAVING total_volumen > 0 
  AND total_volumen = (
    SELECT MAX(vol_max.total_vol)
    FROM (
      SELECT 
        u2.agente_id,
        COALESCE(SUM(rp2.conversion_galonaje), 0) AS total_vol
      FROM users u2
      LEFT JOIN registro_servicios rs2 ON rs2.user_id = u2.id 
        AND rs2.fecha_registro BETWEEN @mes_anterior_inicio AND @mes_anterior_fin
        AND rs2.estado_id = 2 
        AND rs2.estado_agente_id = 2
      LEFT JOIN registro_productos rp2 ON rp2.registro_id = rs2.id
      WHERE u2.agente_id = u.agente_id AND u2.rol_id = 1
      GROUP BY u2.id, u2.agente_id
    ) vol_max
    WHERE vol_max.agente_id = u.agente_id
  )
ORDER BY agente_nombre, total_volumen DESC;


-- =====================================================
-- CONSULTA PARA VER RANKING COMPLETO POR AGENTE
-- (Incluye todos los asesores, no solo campeones)
-- =====================================================

SELECT 
  u.id AS asesor_id,
  u.name AS asesor_nombre,
  u.agente_id,
  ag.descripcion AS agente_nombre,
  COALESCE(SUM(rp.conversion_galonaje), 0) AS total_volumen,
  COUNT(DISTINCT rs.id) AS total_registros,
  COUNT(DISTINCT rs.pdv_id) AS pdvs_visitados,
  ROW_NUMBER() OVER (PARTITION BY u.agente_id ORDER BY COALESCE(SUM(rp.conversion_galonaje), 0) DESC) AS posicion_agente,
  CASE 
    WHEN ROW_NUMBER() OVER (PARTITION BY u.agente_id ORDER BY COALESCE(SUM(rp.conversion_galonaje), 0) DESC) = 1 
      AND COALESCE(SUM(rp.conversion_galonaje), 0) > 0 
    THEN 'SI - CAMPEÓN' 
    ELSE 'NO'
  END AS califica_bono
FROM users u
INNER JOIN agente ag ON ag.id = u.agente_id
LEFT JOIN registro_servicios rs ON rs.user_id = u.id 
  AND rs.fecha_registro BETWEEN @mes_anterior_inicio AND @mes_anterior_fin
  AND rs.estado_id = 2 
  AND rs.estado_agente_id = 2
LEFT JOIN registro_productos rp ON rp.registro_id = rs.id
WHERE u.rol_id = 1 
  AND u.agente_id IS NOT NULL
GROUP BY u.id, u.name, u.email, u.agente_id, ag.descripcion
ORDER BY ag.descripcion, posicion_agente ASC;


-- =====================================================
-- CONSULTA PARA VERIFICAR SI YA EXISTE EL BONO
-- =====================================================

SELECT 
  rb.id,
  rb.id_asesor,
  u.name AS asesor_nombre,
  u.agente_id,
  ag.descripcion AS agente_nombre,
  rb.puntos,
  rb.descripcion,
  rb.detalle,
  rb.created
FROM retos_bonificadores rb
INNER JOIN users u ON u.id = rb.id_asesor
LEFT JOIN agente ag ON ag.id = u.agente_id
WHERE rb.descripcion LIKE '%Campeón por Agente%'
ORDER BY rb.created DESC;


-- =====================================================
-- EJEMPLO DE USO PARA DIFERENTES MESES
-- =====================================================

-- Para calcular el bono de Octubre 2025:
-- SET @mes_anterior_inicio = '2025-10-01';
-- SET @mes_anterior_fin = '2025-10-31';
-- SET @nombre_mes = 'Octubre';
-- SET @anio = 2025;

-- Para calcular el bono de Septiembre 2025:
-- SET @mes_anterior_inicio = '2025-09-01';
-- SET @mes_anterior_fin = '2025-09-30';
-- SET @nombre_mes = 'Septiembre';
-- SET @anio = 2025;
