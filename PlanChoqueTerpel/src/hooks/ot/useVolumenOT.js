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
                    console.warn('No hay token de autenticación disponible');
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
                
                console.log('🔍 Fetching volumen data from:', url);
                console.log('📋 Token present:', !!token);
                
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
                console.log('✅ Volumen data received:', data);
                
                if (data.success) {
                    setVolumen(data);
                } else {
                    throw new Error(data.message || 'Error al obtener datos de volumen');
                }
            } catch (err) {
                console.error('❌ Error fetching volumen:', err);
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
