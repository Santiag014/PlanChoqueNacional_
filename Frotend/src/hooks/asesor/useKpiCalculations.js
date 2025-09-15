import { useMemo } from 'react';

// Hook para manejar los cálculos complejos de KPIs
export const useKpiCalculations = (dashboardData, filters, kpiLabels, puntosPorKpiActualizados) => {
  // Validación defensiva de los datos de entrada
  const { pdvMetas = [], kpiPuntos = [] } = dashboardData || {};
  const filtersS = filters || {};
  const kpiLabelsS = Array.isArray(kpiLabels) ? kpiLabels : [];
  const puntosPorKpiActualizadosS = Array.isArray(puntosPorKpiActualizados) ? puntosPorKpiActualizados : [];

  // Filtrar PDVs según los filtros aplicados
  const pdvsFiltrados = useMemo(() => {
    return pdvMetas.filter(pdv => {
      const nombreMatch = !filtersS.nombre || 
        pdv.descripcion?.toLowerCase().includes(filtersS.nombre.toLowerCase());
      const codigoMatch = !filtersS.codigo || 
        pdv.codigo?.toString().includes(filtersS.codigo);
      return nombreMatch && codigoMatch;
    });
  }, [pdvMetas, filtersS]);

  // KPI Dashboard filtrado
  const kpiDashboardFiltrado = useMemo(() => {
    return {
      totalPDVs: pdvsFiltrados.length,
      totalConReg: pdvsFiltrados.filter(pdv => pdv.real > 0).length,
      porcentaje: pdvsFiltrados.length > 0 ? 
        Math.round((pdvsFiltrados.filter(pdv => pdv.real > 0).length / pdvsFiltrados.length) * 100) : 0
    };
  }, [pdvsFiltrados]);

  // Códigos de PDVs filtrados para comparación
  const pdvsFiltradosCodigos = useMemo(() => {
    return pdvsFiltrados.map(pdv => pdv.codigo?.toString());
  }, [pdvsFiltrados]);

  // Cálculo de puntos por KPI
  const puntosPorKPI = useMemo(() => {
    return kpiLabelsS.map(kpi => {
      // Filtrar kpiPuntos por KPI con múltiples criterios de búsqueda
      const puntosKpiFiltrados = kpiPuntos.filter(p => {
        // Verificar que coincida el KPI usando múltiples campos posibles
        const coincideKpi = p.kpi_id === kpi.id || 
                           p.kpiId === kpi.id || 
                           p.kpi === kpi.id ||
                           p.tipo === kpi.name ||
                           p.tipo_kpi === kpi.name ||
                           p.kpi_tipo === kpi.name ||
                           p.nombre === kpi.name ||
                           p.name === kpi.name ||
                           (p.kpi_nombre && p.kpi_nombre.toLowerCase() === kpi.name.toLowerCase());
        
        // Si no hay filtros aplicados, incluir todos los PDVs
        if (!filtersS.nombre && !filtersS.codigo) {
          return coincideKpi;
        }
        
        // Si hay filtros, verificar que el PDV esté en la lista filtrada
        const coincidePdv = pdvsFiltradosCodigos.includes(p.pdv_codigo?.toString()) || 
                           pdvsFiltradosCodigos.includes(p.codigo_pdv?.toString()) ||
                           pdvsFiltradosCodigos.includes(p.codigo?.toString()) ||
                           pdvsFiltradosCodigos.includes(p.pdv?.toString()) ||
                           pdvsFiltrados.some(pdv => pdv.id === p.pdv_id || pdv.codigo?.toString() === p.codigo?.toString());
        
        return coincideKpi && coincidePdv;
      });
      
      // Sumar todos los puntos de este KPI con múltiples campos posibles
      const total = puntosKpiFiltrados.reduce((sum, p) => {
        const puntos = Number(p.puntos_kpi) || 
                      Number(p.puntos) || 
                      Number(p.puntos_totales) || 
                      Number(p.valor) || 
                      Number(p.total) || 
                      Number(p.puntaje) ||
                      Number(p.score) ||
                      0;
        return sum + puntos;
      }, 0);
      
      return { ...kpi, puntos: total };
    });
  }, [kpiLabelsS, kpiPuntos, filtersS, pdvsFiltradosCodigos, pdvsFiltrados]);

  // Usar puntos actualizados si están disponibles, sino usar los calculados
  const puntosPorKPIFinal = useMemo(() => {
    return puntosPorKpiActualizadosS.length > 0 ? 
      puntosPorKpiActualizadosS : puntosPorKPI;
  }, [puntosPorKpiActualizadosS, puntosPorKPI]);

  // Fallback si todos los puntos son 0
  const puntosPorKPIConFallback = useMemo(() => {
    let resultado = puntosPorKPIFinal;
    
    if (resultado.every(kpi => kpi.puntos === 0) && kpiPuntos.length > 0) {
      //console.log('🔄 Aplicando método de fallback manual...');
      
      resultado = kpiLabelsS.map(kpi => {
        const posiblesRegistros = kpiPuntos.filter(p => {
          const texto = (p.tipo || p.kpi_tipo || p.nombre || p.kpi_nombre || '').toLowerCase();
          return texto.includes(kpi.name.toLowerCase()) || 
                 texto.includes(kpi.label.toLowerCase()) ||
                 p.kpi_id === kpi.id ||
                 p.id === kpi.id;
        });
        
        const registrosPorId = posiblesRegistros.length === 0 ? 
          kpiPuntos.filter(p => p.kpi_id === kpi.id || p.id === kpi.id) : 
          posiblesRegistros;
        
        const total = registrosPorId.reduce((sum, p) => {
          const valores = [
            p.puntos_kpi, p.puntos, p.puntos_totales, p.valor, 
            p.total, p.puntaje, p.score, p.cantidad, p.resultado
          ].filter(v => v !== undefined && v !== null);
          
          const puntos = valores.length > 0 ? Number(valores[0]) || 0 : 0;
          return sum + puntos;
        }, 0);
        
        return { ...kpi, puntos: total };
      });
    }
    
    return resultado;
  }, [puntosPorKPIFinal, kpiPuntos, kpiLabelsS]);

  return {
    pdvsFiltrados,
    kpiDashboardFiltrado,
    puntosPorKPIFinal: puntosPorKPIConFallback
  };
};
