// Endpoint para generar Excel de implementaciones usando ExcelJS y plantilla
router.get('/implementaciones/excel', authenticateToken, requireOT, addUserRestrictions, logAccess, async (req, res) => {
  let conn;
  try {
    console.log('🚀 Iniciando generación de Excel de implementaciones con ExcelJS...');
    
    conn = await getConnection();
    
    // Query SQL base para obtener los datos
    const baseQuery = `
      SELECT 
          agente.descripcion AS agente,
          pv.codigo,
          pv.nit,
          pv.descripcion AS nombre_PDV,
          pv.direccion,
          pv.segmento,
          pv.ciudad,
          g.GalonajeVendido,

          -- Total de implementaciones habilitadas (Pendiente o Realizada)
          (
              (CASE 
                  WHEN EXISTS (
                      SELECT 1 FROM registro_servicios rs 
                      INNER JOIN registros_implementacion ri ON ri.id_registro = rs.id
                      WHERE rs.pdv_id = pv.id AND ri.nro_implementacion = 1
                  ) OR g.GalonajeVendido >= pvi.compra_1 THEN 1 ELSE 0 END)
              +
              (CASE 
                  WHEN EXISTS (
                      SELECT 1 FROM registro_servicios rs 
                      INNER JOIN registros_implementacion ri ON ri.id_registro = rs.id
                      WHERE rs.pdv_id = pv.id AND ri.nro_implementacion = 2
                  ) OR g.GalonajeVendido >= pvi.compra_2 THEN 1 ELSE 0 END)
              +
              (CASE 
                  WHEN EXISTS (
                      SELECT 1 FROM registro_servicios rs 
                      INNER JOIN registros_implementacion ri ON ri.id_registro = rs.id
                      WHERE rs.pdv_id = pv.id AND ri.nro_implementacion = 3
                  ) OR g.GalonajeVendido >= pvi.compra_3 THEN 1 ELSE 0 END)
              +
              (CASE 
                  WHEN EXISTS (
                      SELECT 1 FROM registro_servicios rs 
                      INNER JOIN registros_implementacion ri ON ri.id_registro = rs.id
                      WHERE rs.pdv_id = pv.id AND ri.nro_implementacion = 4
                  ) OR g.GalonajeVendido >= pvi.compra_4 THEN 1 ELSE 0 END)
              +
              (CASE 
                  WHEN EXISTS (
                      SELECT 1 FROM registro_servicios rs 
                      INNER JOIN registros_implementacion ri ON ri.id_registro = rs.id
                      WHERE rs.pdv_id = pv.id AND ri.nro_implementacion = 5
                  ) OR g.GalonajeVendido >= pvi.compra_5 THEN 1 ELSE 0 END)
          ) AS Total_Habilitadas,

          -- Implementacion 1
          CASE 
              WHEN EXISTS (
                  SELECT 1 FROM registro_servicios rs 
                  INNER JOIN registros_implementacion ri ON ri.id_registro = rs.id
                  WHERE rs.pdv_id = pv.id AND ri.nro_implementacion = 1
              ) THEN 'Realizada'
              WHEN g.GalonajeVendido >= pvi.compra_1 THEN 'Pendiente'
              ELSE 'No Habilitado'
          END AS Implementacion_1,

          -- Implementacion 2
          CASE 
              WHEN EXISTS (
                  SELECT 1 FROM registro_servicios rs 
                  INNER JOIN registros_implementacion ri ON ri.id_registro = rs.id
                  WHERE rs.pdv_id = pv.id AND ri.nro_implementacion = 2
              ) THEN 'Realizada'
              WHEN g.GalonajeVendido >= pvi.compra_2 THEN 'Pendiente'
              ELSE 'No Habilitado'
          END AS Implementacion_2,

          -- Implementacion 3
          CASE 
              WHEN EXISTS (
                  SELECT 1 FROM registro_servicios rs 
                  INNER JOIN registros_implementacion ri ON ri.id_registro = rs.id
                  WHERE rs.pdv_id = pv.id AND ri.nro_implementacion = 3
              ) THEN 'Realizada'
              WHEN g.GalonajeVendido >= pvi.compra_3 THEN 'Pendiente'
              ELSE 'No Habilitado'
          END AS Implementacion_3,

          -- Implementacion 4
          CASE 
              WHEN EXISTS (
                  SELECT 1 FROM registro_servicios rs 
                  INNER JOIN registros_implementacion ri ON ri.id_registro = rs.id
                  WHERE rs.pdv_id = pv.id AND ri.nro_implementacion = 4
              ) THEN 'Realizada'
              WHEN g.GalonajeVendido >= pvi.compra_4 THEN 'Pendiente'
              ELSE 'No Habilitado'
          END AS Implementacion_4,

          -- Implementacion 5
          CASE 
              WHEN EXISTS (
                  SELECT 1 FROM registro_servicios rs 
                  INNER JOIN registros_implementacion ri ON ri.id_registro = rs.id
                  WHERE rs.pdv_id = pv.id AND ri.nro_implementacion = 5
              ) THEN 'Realizada'
              WHEN g.GalonajeVendido >= pvi.compra_5 THEN 'Pendiente'
              ELSE 'No Habilitado'
          END AS Implementacion_5

      FROM puntos_venta pv
      LEFT JOIN puntos_venta__implementacion pvi 
          ON pvi.pdv_id = pv.id
      INNER JOIN agente 
          ON agente.id = pv.id_agente
      -- Subconsulta para evitar repetir el SUM
      LEFT JOIN (
          SELECT rs.pdv_id, COALESCE(SUM(rp.conversion_galonaje), 0) AS GalonajeVendido
          FROM registro_servicios rs
          INNER JOIN registro_productos rp ON rp.registro_id = rs.id
          WHERE rs.estado_id = 2 AND rs.estado_agente_id = 2
          GROUP BY rs.pdv_id
      ) g ON g.pdv_id = pv.id
      ORDER BY agente.descripcion, pv.descripcion
    `;

    // Aplicar filtros de usuario según permisos
    const { query, params } = await applyUserFilters(baseQuery, req.user.id, 'pv');
    
    // Ejecutar query
    const [results] = await conn.execute(query, params);
    console.log(`📊 Consulta ejecutada. Registros encontrados: ${results.length}`);

    if (results.length === 0) {
      console.log('⚠️ No se encontraron registros en la base de datos');
      return res.status(404).json({ 
        success: false,
        message: 'No se encontraron registros de implementaciones' 
      });
    }

    // Crear nuevo workbook con ExcelJS
    console.log('📋 Creando workbook con ExcelJS...');
    const workbook = new ExcelJS.Workbook();
    
    // Intentar cargar plantilla si existe
    const templatePath = path.join(process.cwd(), 'config', 'Plantilla_Implementaciones.xlsx');
    let worksheet;
    
    try {
      if (fs.existsSync(templatePath)) {
        console.log('📋 Cargando plantilla desde:', templatePath);
        await workbook.xlsx.readFile(templatePath);
        worksheet = workbook.worksheets[0]; // Primera hoja
        console.log('✅ Plantilla cargada exitosamente');
        
        // Limpiar datos existentes (desde fila 5 en adelante)
        console.log('🧹 Limpiando datos existentes de la plantilla...');
        const maxRows = worksheet.rowCount;
        for (let i = 5; i <= maxRows; i++) {
          const row = worksheet.getRow(i);
          for (let j = 2; j <= 13; j++) { // Columnas B a M
            row.getCell(j).value = null;
          }
        }
      } else {
        console.log('⚠️ Plantilla no encontrada, creando hoja nueva');
        worksheet = workbook.addWorksheet('Implementaciones');
      }
    } catch (templateError) {
      console.log('⚠️ Error cargando plantilla, creando hoja nueva:', templateError.message);
      worksheet = workbook.addWorksheet('Implementaciones');
    }

    // Definir headers
    const headers = [
      'Empresa', 'Código', 'Nombre P.D.V', 'Dirección', 'Segmento', 
      'Galones Comprado', 'Cuantas implementaciones puede tener',
      'Primera implementación', 'Segunda implementación', 'Tercera implementación', 
      'Cuarta implementación', 'Quinta implementación'
    ];

    // Configurar la fila de headers (fila 4)
    console.log('🎨 Configurando headers con formato naranja...');
    const headerRow = worksheet.getRow(4);
    
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 2); // Empezar en columna B (índice 2)
      cell.value = header;
      
      // Aplicar estilo naranja al header
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF6600' } // Naranja
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' } // Blanco
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Función para obtener el color según el estado
    const getColorFill = (estado) => {
      switch (estado) {
        case 'Realizada':
          return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } }; // Verde
        case 'Pendiente':
          return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } }; // Amarillo
        case 'No Habilitado':
        default:
          return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFB6C1' } }; // Rosa
      }
    };

    // Escribir datos empezando desde la fila 5
    console.log(`📝 Escribiendo ${results.length} registros con colores de semáforo...`);
    let currentRow = 5;

    results.forEach((row, index) => {
      const dataRow = worksheet.getRow(currentRow + index);
      
      // Datos básicos
      const rowData = [
        row.agente || '',
        row.codigo || '',
        row.nombre_PDV || '',
        row.direccion || '',
        row.segmento || '',
        row.GalonajeVendido || 0,
        row.Total_Habilitadas || 0,
        row.Implementacion_1 || 'No Habilitado',
        row.Implementacion_2 || 'No Habilitado',
        row.Implementacion_3 || 'No Habilitado',
        row.Implementacion_4 || 'No Habilitado',
        row.Implementacion_5 || 'No Habilitado'
      ];

      // Escribir cada celda con formato
      rowData.forEach((value, colIndex) => {
        const cell = dataRow.getCell(colIndex + 2); // Empezar en columna B
        cell.value = value;
        
        // Aplicar color de fondo si es columna de implementación (índices 7-11)
        if (colIndex >= 7 && colIndex <= 11) {
          cell.fill = getColorFill(value);
        }
        
        // Bordes para todas las celdas
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Alineación
        if (typeof value === 'number') {
          cell.alignment = { horizontal: 'center' };
        } else {
          cell.alignment = { horizontal: 'left' };
        }
      });
    });

    // Configurar anchos de columna
    console.log('📐 Configurando anchos de columna...');
    const columnWidths = [15, 12, 10, 25, 30, 15, 12, 12, 18, 18, 18, 18, 18];
    columnWidths.forEach((width, index) => {
      const column = worksheet.getColumn(index + 1);
      column.width = width;
    });

    // Generar archivo Excel
    console.log('💾 Generando archivo Excel...');
    const buffer = await workbook.xlsx.writeBuffer();

    // Configurar headers para descarga
    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
    const filename = `Reporte_Implementaciones_${timestamp}.xlsx`;

    console.log(`📦 Archivo generado: ${filename} (${buffer.length} bytes)`);

    // Configurar headers de respuesta
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('ETag', '');
    res.setHeader('Last-Modified', new Date().toUTCString());

    console.log(`📤 Enviando archivo: ${filename} (${buffer.length} bytes)`);

    // Enviar archivo
    res.end(buffer, 'binary');

  } catch (error) {
    console.error('❌ Error generando Excel de implementaciones:', error);
    
    if (res.headersSent) {
      console.error('Headers ya enviados, no se puede cambiar la respuesta');
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al generar el reporte de implementaciones',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (conn) conn.release();
  }
});
