import { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Hook personalizado para descargar datos en formato Excel
 * @returns {Object} Objeto con funciones para descargar datos
 */
export const useExcelDownload = () => {
  const [loading, setLoading] = useState(false);

  /**
   * Función para crear una hoja Excel para un KPI específico
   * @param {Array} data - Datos del KPI
   * @param {string} metricType - Tipo de métrica
   * @returns {Object} Objeto con la hoja y el nombre
   */
  const createKPIWorksheet = (data, metricType) => {
    let worksheetData = [];
    let headers = [];
    let sheetName = '';
    
    switch (metricType) {
      case 'cobertura':
        sheetName = 'Cobertura';
        headers = ['Código PDV', 'Nombre PDV', 'Asesor', 'Estado', 'Puntos', 'Fecha Implementación'];
        worksheetData = data.map(item => [
          item.codigo || 'N/A',
          item.nombre || 'N/A',
          item.asesor_nombre || 'N/A',
          item.estado || 'N/A',
          Number(item.puntos) || 0,
          item.fecha_implementacion || 'N/A'
        ]);
        break;
        
      case 'volumen':
        sheetName = 'Volumen';
        headers = ['Código PDV', 'Nombre PDV', 'Asesor', 'Segmento', 'Meta', 'Real', '% Cumplimiento', 'Puntos'];
        worksheetData = data.map(item => {
          const meta = Number(item.meta) || 0;
          const real = Number(item.real) || 0;
          const porcentaje = meta > 0 ? Math.round((real / meta) * 100) : 0;
          const puntos = Number(item.puntos) || 0;
          
          return [
            item.codigo || 'N/A',
            item.nombre || 'N/A',
            item.asesor_nombre || 'N/A',
            item.segmento || 'N/A',
            meta,
            real,
            porcentaje,
            puntos
          ];
        });
        break;
        
      case 'visitas':
        sheetName = 'Frecuencia';
        headers = ['Código PDV', 'Nombre PDV', 'Asesor', 'Visitas Realizadas', 'Meta Visitas', '% Cumplimiento', 'Puntos'];
        worksheetData = data.map(item => {
          const visitasRealizadas = Number(item.cantidadVisitas) || 0;
          const metaVisitas = Number(item.meta) || 0;
          const porcentaje = Number(item.porcentaje) || 0;
          const puntos = Number(item.puntos) || 0;
          
          return [
            item.codigo || 'N/A',
            item.nombre || 'N/A',
            item.asesor_nombre || 'N/A',
            visitasRealizadas,
            metaVisitas,
            porcentaje,
            puntos
          ];
        });
        break;
        
      case 'productividad':
        sheetName = 'Profundidad';
        headers = ['Código PDV', 'Nombre PDV', 'Asesor', 'Estado', 'Puntos', 'Fecha Registro'];
        worksheetData = data.map(item => [
          item.codigo || 'N/A',
          item.nombre || 'N/A',
          item.asesor_nombre || 'N/A',
          item.estado || 'N/A',
          Number(item.puntos) || 0,
          item.fecha_registro || 'N/A'
        ]);
        break;
        
      case 'precios':
        sheetName = 'Precios';
        headers = ['Código PDV', 'Nombre PDV', 'Asesor', 'Estado', 'Puntos', 'Fecha Reporte'];
        worksheetData = data.map(item => [
          item.codigo || 'N/A',
          item.nombre || 'N/A',
          item.asesor_nombre || 'N/A',
          item.estado || 'N/A',
          Number(item.puntos) || 0,
          item.fecha_reporte || 'N/A'
        ]);
        break;
        
      default:
        sheetName = 'Datos';
        headers = ['Datos'];
        worksheetData = [['No hay datos disponibles']];
    }
    
    // Crear la hoja de trabajo
    const wsData = [headers, ...worksheetData];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    
    // Configurar anchos de columnas
    const colWidths = headers.map((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...worksheetData.map(row => String(row[index] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 25) };
    });
    worksheet['!cols'] = colWidths;
    
    // Aplicar formato a headers
    for (let col = 0; col < headers.length; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "E30613" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }
    
    return { worksheet, sheetName, data: worksheetData };
  };

  /**
   * Función para descargar todos los datos de KPIs en un solo archivo Excel
   * @param {Object} allData - Objeto con todos los datos de KPIs
   * @param {string} userType - Tipo de usuario ('asesor' o 'ot')
   */
  const downloadAllKPIData = (allData, userType = 'ot') => {
    setLoading(true);
    
    try {
      const workbook = XLSX.utils.book_new();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      
      // Crear hoja de resumen ejecutivo
      const summaryData = [
        ['REPORTE COMPLETO DE KPIs'],
        ['Fecha de Generación:', new Date().toLocaleDateString('es-CO')],
        ['Hora de Generación:', new Date().toLocaleTimeString('es-CO')],
        ['Usuario:', userType === 'asesor' ? 'Asesor' : 'Organización Terpel'],
        [''],
        ['RESUMEN POR KPI'],
        ['KPI', 'Total PDVs', 'Puntos Total', 'Promedio por PDV']
      ];
      
      let totalPuntosGeneral = 0;
      let totalPDVsUnicos = 0;
      let pdvsProcessados = new Set(); // Para contar PDVs únicos
      
      // Agregar datos del resumen
      const kpiTypes = ['cobertura', 'volumen', 'visitas', 'productividad', 'precios'];
      const kpiNames = {
        cobertura: 'Cobertura',
        volumen: 'Volumen',
        visitas: 'Frecuencia',
        productividad: 'Profundidad',
        precios: 'Precios'
      };
      
      kpiTypes.forEach(kpiType => {
        const data = allData[kpiType] || [];
        const totalPuntos = data.reduce((sum, item) => sum + (Number(item.puntos) || 0), 0);
        const totalPDVs = data.length;
        const promedio = totalPDVs > 0 ? (totalPuntos / totalPDVs).toFixed(2) : 0;
        
        summaryData.push([
          kpiNames[kpiType],
          totalPDVs,
          totalPuntos,
          promedio
        ]);
        
        totalPuntosGeneral += totalPuntos;
        
        // Contar PDVs únicos
        data.forEach(item => {
          if (item.codigo) {
            pdvsProcessados.add(item.codigo);
          }
        });
      });
      
      totalPDVsUnicos = pdvsProcessados.size;
      
      // Agregar totales generales
      summaryData.push(['']);
      summaryData.push(['TOTALES GENERALES']);
      summaryData.push(['Total Puntos:', totalPuntosGeneral]);
      summaryData.push(['Promedio General:', totalPDVsUnicos > 0 ? (totalPuntosGeneral / totalPDVsUnicos).toFixed(2) : 0]);
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      
      // Aplicar formato a la hoja de resumen
      for (let row = 0; row < summaryData.length; row++) {
        for (let col = 0; col < (summaryData[row].length || 0); col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (summaryWs[cellRef]) {
            if (row === 0 || row === 5 || summaryData[row][0] === 'TOTALES GENERALES') {
              summaryWs[cellRef].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "E30613" } },
                alignment: { horizontal: "center", vertical: "center" }
              };
            } else if (row === 6) {
              summaryWs[cellRef].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "F8F9FA" } },
                alignment: { horizontal: "center", vertical: "center" }
              };
            }
          }
        }
      }
      
      XLSX.utils.book_append_sheet(workbook, summaryWs, 'Resumen Ejecutivo');
      
      // Crear una hoja para cada KPI
      kpiTypes.forEach(kpiType => {
        const data = allData[kpiType] || [];
        if (data.length > 0) {
          const { worksheet, sheetName } = createKPIWorksheet(data, kpiType);
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }
      });
      
      // Descargar archivo
      const fileName = `Reporte_Completo_KPIs_${userType}_${timestamp}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error('Error al generar el archivo Excel:', error);
      alert('Error al generar el archivo. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función para descargar historial de visitas
   * @param {Array} visitasData - Datos de visitas
   */
  const downloadVisitasHistorial = (visitasData) => {
    setLoading(true);
    
    try {
      const workbook = XLSX.utils.book_new();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      
      // Hoja principal - Detalle de visitas
      const headers = [
        'Código PDV', 'Nombre PDV', 'Asesor', 'Fecha Visita', 'Hora', 
        'Tipo Visita', 'Observaciones', 'Estado', 'Puntos Obtenidos'
      ];
      
      const worksheetData = visitasData.map(visita => [
        visita.codigo_pdv || 'N/A',
        visita.nombre_pdv || 'N/A',
        visita.asesor_nombre || 'N/A',
        visita.fecha_visita || 'N/A',
        visita.hora_visita || 'N/A',
        visita.tipo_visita || 'N/A',
        visita.observaciones || 'N/A',
        visita.estado || 'N/A',
        visita.puntos || 0
      ]);
      
      const wsData = [headers, ...worksheetData];
      const worksheet = XLSX.utils.aoa_to_sheet(wsData);
      
      // Configurar anchos de columnas
      worksheet['!cols'] = [
        { wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 8 },
        { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 12 }
      ];
      
      // Aplicar formato a headers
      for (let col = 0; col < headers.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "E30613" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      }
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial Visitas');
      
      // Hoja de resumen por asesor
      const asesoresResumen = visitasData.reduce((acc, visita) => {
        const asesor = visita.asesor_nombre || 'Sin Asesor';
        if (!acc[asesor]) {
          acc[asesor] = { 
            visitas: 0, 
            puntos: 0, 
            pdvs: new Set() 
          };
        }
        acc[asesor].visitas++;
        acc[asesor].puntos += visita.puntos || 0;
        acc[asesor].pdvs.add(visita.codigo_pdv);
        return acc;
      }, {});
      
      const resumenHeaders = ['Asesor', 'Total Visitas', 'PDVs Visitados', 'Puntos Total', 'Promedio Puntos/Visita'];
      const resumenData = Object.entries(asesoresResumen).map(([asesor, data]) => [
        asesor,
        data.visitas,
        data.pdvs.size,
        data.puntos,
        data.visitas > 0 ? (data.puntos / data.visitas).toFixed(2) : 0
      ]);
      
      const resumenWsData = [resumenHeaders, ...resumenData];
      const resumenWs = XLSX.utils.aoa_to_sheet(resumenWsData);
      resumenWs['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }];
      
      XLSX.utils.book_append_sheet(workbook, resumenWs, 'Resumen por Asesor');
      
      // Descargar archivo
      const fileName = `Historial_Visitas_${timestamp}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error('Error al generar el archivo Excel:', error);
      alert('Error al generar el archivo. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return {
    downloadKPIData: downloadAllKPIData, // Mantener compatibilidad
    downloadAllKPIData,
    downloadVisitasHistorial,
    loading
  };
};
