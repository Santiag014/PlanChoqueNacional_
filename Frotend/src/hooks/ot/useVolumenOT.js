import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

export function useVolumenOT(filtros = {}) {
    const [volumen, setVolumen] = useState({
        pdvs: [],
        meta_volumen: 0,
        real_volumen: 0,
        puntos: 0,
        segmentos: [],
        productos: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVolumen = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                if (!token) {
                    //console.warn('No hay token de autenticación disponible');
                    setError('Por favor, inicia sesión para acceder a esta información');
                    setVolumen({
                        pdvs: [],
                        meta_volumen: 0,
                        real_volumen: 0,
                        puntos: 0,
                        segmentos: [],
                        productos: []
                    });
                    return;
                }

                const params = new URLSearchParams();
                
                // Construir parámetros de filtros
                if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
                if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
                if (filtros.asesor) params.append('asesor_id', filtros.asesor);
                if (filtros.pdv) params.append('pdv_id', filtros.pdv);
                if (filtros.compania) params.append('compania', filtros.compania);
                if (filtros.agente) params.append('agente_id', filtros.agente);
                
                const queryString = params.toString();
                const url = `${API_URL}/api/ot/volumen${queryString ? `?${queryString}` : ''}`;
                // // console.log('🔍 Fetching volumen data from:', url);
                // console.log('📋 Token present:', !!token);

                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error('No tienes permisos para acceder a esta información');
                    }
                    if (response.status === 401) {
                        throw new Error('Token de autenticación inválido o expirado');
                    }
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                // console.log('✅ Volumen data received:', data);

                if (data.success) {
                    // Los datos ya vienen filtrados por el backend según las restricciones del usuario
                    let processedData = { ...data };
                    
                    // Obtener PDVs (ya filtrados por el backend)
                    let filteredPdvs = Array.isArray(data.pdvs) ? data.pdvs : [];
                    //console.log(`� useVolumenOT: Datos recibidos del backend - ${filteredPdvs.length} PDVs`);
                    
                    // Aplicar filtros manuales adicionales SOLO si se han especificado en el frontend
                    if (filtros.compania) {
                        filteredPdvs = filteredPdvs.filter(pdv => pdv.compania === filtros.compania);
                        //console.log(`🔍 useVolumenOT: Filtro manual de compañía aplicado - filtrado por: ${filtros.compania}`);
                    }
                    
                    // Recalcular totales con PDVs filtrados
                    const totalMeta = filteredPdvs.reduce((sum, pdv) => sum + (pdv.meta_volumen || 0), 0);
                    const totalReal = filteredPdvs.reduce((sum, pdv) => sum + (pdv.real_volumen || 0), 0);
                    const totalPuntos = filteredPdvs.reduce((sum, pdv) => sum + (pdv.puntos || 0), 0);
                    
                    // Filtrar segmentos y productos con la misma lógica
                    let filteredSegmentos = Array.isArray(data.segmentos) ? data.segmentos : [];
                    let filteredProductos = Array.isArray(data.productos) ? data.productos : [];
                    
                    // console.log('🔍 useVolumenOT: Datos originales:', {
                    //     segmentos: filteredSegmentos.length,
                    //     productos: filteredProductos.length,
                    //     estructuraSegmento: filteredSegmentos[0] || 'N/A',
                    //     estructuraProducto: filteredProductos[0] || 'N/A'
                    // });
                    
                    // Aplicar filtros a segmentos - RECALCULAR desde PDVs filtrados
                    if (filteredSegmentos.length > 0) {
                        // Si hay filtros activos, recalcular segmentos desde PDVs filtrados
                        if (filtros.compania && filteredPdvs.length !== data.pdvs.length) {
                            //console.log('🔄 useVolumenOT: Recalculando segmentos desde PDVs filtrados');
                            // Agrupar PDVs filtrados por segmento
                            const segmentosRecalculados = {};
                            filteredPdvs.forEach(pdv => {
                                const segmento = pdv.segmento || 'Sin Segmento';
                                if (!segmentosRecalculados[segmento]) {
                                    segmentosRecalculados[segmento] = {
                                        segmento: segmento,
                                        cantidadPdvs: 0,
                                        totalGalones: 0
                                    };
                                }
                                segmentosRecalculados[segmento].cantidadPdvs += 1;
                                segmentosRecalculados[segmento].totalGalones += (pdv.real_volumen || 0);
                            });
                            filteredSegmentos = Object.values(segmentosRecalculados);
                            //console.log(`✅ useVolumenOT: Segmentos recalculados desde PDVs - ${Object.keys(segmentosRecalculados).length} segmentos`);
                        }
                        // Filtrar por compañía si existe el campo y no se recalculó
                        else if (filteredSegmentos[0].compania) {
                            // Aplicar filtros manuales solamente
                            if (filtros.compania) {
                                filteredSegmentos = filteredSegmentos.filter(seg => seg.compania === filtros.compania);
                            }
                            //console.log(`✅ useVolumenOT: Segmentos filtrados por compañía - ${data.segmentos.length} -> ${filteredSegmentos.length}`);
                        }
                        // Estrategia 3: Filtrar por códigos de PDV ya filtrados
                        else if (filteredSegmentos[0].pdv_codigo || filteredSegmentos[0].codigo_pdv) {
                            const pdvCodes = filteredPdvs.map(pdv => pdv.codigo);
                            const originalCount = filteredSegmentos.length;
                            filteredSegmentos = filteredSegmentos.filter(seg => 
                                pdvCodes.includes(seg.pdv_codigo || seg.codigo_pdv)
                            );
                            //console.log(`✅ useVolumenOT: Segmentos filtrados por PDV - ${originalCount} -> ${filteredSegmentos.length}`);
                        }
                        // Si hay filtros activos pero no se puede filtrar, limpiar para ser consistentes
                        else if (filtros.compania) {
                            filteredSegmentos = []; // Limpiar si no se puede filtrar correctamente
                            //console.log(`⚠️ useVolumenOT: Segmentos limpiados por inconsistencia de filtros`);
                        }
                    }
                    
                    // Aplicar filtros a productos - RECALCULAR desde PDVs filtrados si es necesario
                    if (filteredProductos.length > 0) {
                        // Si hay filtros de compañía activos, intentar filtrar por compañía directamente
                        if (filtros.compania) {
                            //console.log('🔄 useVolumenOT: Aplicando filtros a productos');

                            // Primero intentar filtrar por compañía si existe el campo
                            if (filteredProductos[0].compania) {
                                // Aplicar filtros manuales
                                if (filtros.compania) {
                                    filteredProductos = filteredProductos.filter(prod => prod.compania === filtros.compania);
                                }
                                //console.log(`✅ useVolumenOT: Productos filtrados por compañía - ${data.productos.length} -> ${filteredProductos.length}`);
                            }
                            // Si no tiene campo compañía, intentar filtrar por PDVs relacionados
                            else if (filteredProductos[0].pdv_codigo || filteredProductos[0].codigo_pdv || filteredProductos[0].pdv_id) {
                                const pdvCodes = filteredPdvs.map(pdv => pdv.codigo);
                                const pdvIds = filteredPdvs.map(pdv => pdv.id);
                                const originalCount = filteredProductos.length;
                                
                                filteredProductos = filteredProductos.filter(prod => {
                                    return pdvCodes.includes(prod.pdv_codigo || prod.codigo_pdv) ||
                                           pdvIds.includes(prod.pdv_id);
                                });
                                
                                //console.log(`✅ useVolumenOT: Productos filtrados por PDV - ${originalCount} -> ${filteredProductos.length}`);
                            }
                            // Si no se puede filtrar específicamente pero hay galonaje en PDVs, mantener productos
                            else if (totalReal > 0) {
                                //console.log(`ℹ️ useVolumenOT: Manteniendo productos (${filteredProductos.length}) porque hay galonaje en PDVs (${totalReal})`);
                                // Solo recalcular porcentajes si es necesario
                                const totalGalonaje = filteredProductos.reduce((sum, prod) => sum + (prod.galonaje || 0), 0);
                                if (totalGalonaje > 0) {
                                    filteredProductos = filteredProductos.map(prod => ({
                                        ...prod,
                                        porcentaje: Math.round((prod.galonaje / totalGalonaje) * 100)
                                    }));
                                }
                            }
                            // Solo limpiar si no hay galonaje en los PDVs filtrados
                            else {
                                filteredProductos = [];
                                //console.log(`⚠️ useVolumenOT: Productos limpiados - no hay galonaje en PDVs filtrados`);
                            }
                        }
                        // Si no hay filtros activos, mantener todos los productos
                        else {
                            //console.log(`ℹ️ useVolumenOT: Sin filtros activos - manteniendo ${filteredProductos.length} productos`);
                        }
                    }
                    
                    // Verificación final de consistencia: Si los PDVs filtrados no tienen galonaje, 
                    // los segmentos y productos tampoco deberían tenerlo
                    if (totalReal === 0 && filtros.compania) {
                        //console.log('⚠️ useVolumenOT: PDVs filtrados sin galonaje - limpiando segmentos para consistencia');
                        // Solo limpiar segmentos si realmente no tienen datos consistentes
                        filteredSegmentos = filteredSegmentos.filter(seg => (seg.totalGalones || 0) === 0);
                        // Para productos, ser menos restrictivo - solo limpiar si realmente no hay datos
                        if (filteredProductos.reduce((sum, prod) => sum + (prod.galonaje || 0), 0) > 0 && totalReal === 0) {
                            //console.log('⚠️ useVolumenOT: Productos tienen galonaje pero PDVs no - posible inconsistencia de datos');
                            // Mantener productos pero agregar advertencia en logs
                        }
                    }
                    
                    processedData = {
                        ...data,
                        pdvs: filteredPdvs,
                        meta_volumen: totalMeta,
                        real_volumen: totalReal,
                        puntos: totalPuntos,
                        segmentos: filteredSegmentos,
                        productos: filteredProductos
                    };
                    
                        // console.log('📊 useVolumenOT: Datos procesados finales:', {
                        //     pdvs: processedData.pdvs.length,
                        //     segmentos: processedData.segmentos.length,
                        //     productos: processedData.productos.length,
                        //     totalVolumen: processedData.real_volumen
                        // });
                    
                    setVolumen(processedData);
                } else {
                    throw new Error(data.message || 'Error al obtener datos de volumen');
                }
            } catch (err) {
                //console.error('❌ Error fetching volumen:', err);
                setError(err.message);
                // Datos de respaldo en caso de error
                setVolumen({
                    pdvs: [],
                    meta_volumen: 0,
                    real_volumen: 0,
                    puntos: 0,
                    segmentos: [],
                    productos: []
                });
            } finally {
                setLoading(false);
            }
        };

        fetchVolumen();
    }, [
        filtros.fechaInicio,
        filtros.fechaFin,
        filtros.asesor,
        filtros.pdv,
        filtros.compania,
        filtros.agente
    ]);

    return {
        volumen,
        loading,
        error,
        refetch: () => {
            setLoading(true);
            setError(null);
        }
    };
}
