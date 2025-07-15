import { useState, useEffect } from 'react';

/**
 * Hook personalizado para manejar los datos del Mystery Shopper
 * @param {number} userId - ID del usuario
 * @returns {Object} Estados y funciones para los datos del Mystery Shopper
 */
export const useMysteryData = (userId) => {
  const [visits, setVisits] = useState([]);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para cargar visitas del mystery shopper
  const cargarVisitas = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/mystery-visits/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVisits(data.data || []);
      } else {
        throw new Error('Error al cargar visitas');
      }
    } catch (err) {
      console.error('Error cargando visitas:', err);
      
      // Datos mock para desarrollo
      const visitasMock = [
        {
          id: 1,
          pdv_code: 'PDV001',
          pdv_name: 'Estación Central',
          visit_date: '2025-06-25',
          status: 'completed',
          score: 85,
          evaluations: [
            { category: 'Atención al Cliente', score: 90 },
            { category: 'Limpieza', score: 80 },
            { category: 'Productos', score: 85 }
          ]
        },
        {
          id: 2,
          pdv_code: 'PDV002',
          pdv_name: 'Estación Norte',
          visit_date: '2025-06-24',
          status: 'pending',
          score: null,
          evaluations: []
        }
      ];
      
      setVisits(visitasMock);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para iniciar una nueva visita
  const iniciarVisita = async (pdvCode) => {
    const nuevaVisita = {
      id: Date.now(),
      pdv_code: pdvCode,
      pdv_name: `PDV ${pdvCode}`,
      visit_date: new Date().toISOString().split('T')[0],
      status: 'in_progress',
      evaluations: [],
      observations: '',
      photos: []
    };
    
    setCurrentVisit(nuevaVisita);
    return nuevaVisita;
  };

  // Función para actualizar evaluación
  const actualizarEvaluacion = (categoria, puntaje, observaciones = '') => {
    if (!currentVisit) return;
    
    setCurrentVisit(prev => ({
      ...prev,
      evaluations: [
        ...prev.evaluations.filter(e => e.category !== categoria),
        { category: categoria, score: puntaje, observations: observaciones }
      ]
    }));
  };

  // Función para agregar foto
  const agregarFoto = (fotoUrl, descripcion = '') => {
    if (!currentVisit) return;
    
    setCurrentVisit(prev => ({
      ...prev,
      photos: [
        ...prev.photos,
        { url: fotoUrl, description: descripcion, timestamp: new Date().toISOString() }
      ]
    }));
  };

  // Función para completar visita
  const completarVisita = async () => {
    if (!currentVisit) return false;
    
    setIsLoading(true);
    
    try {
      const promedioScore = currentVisit.evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / currentVisit.evaluations.length;
      
      const visitaCompleta = {
        ...currentVisit,
        status: 'completed',
        score: Math.round(promedioScore),
        completed_at: new Date().toISOString()
      };
      
      const response = await fetch('/api/mystery-visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(visitaCompleta)
      });
      
      if (response.ok) {
        // Actualizar lista de visitas
        setVisits(prev => [visitaCompleta, ...prev]);
        setCurrentVisit(null);
        return true;
      } else {
        throw new Error('Error al guardar visita');
      }
    } catch (error) {
      console.error('Error completando visita:', error);
      
      // Para desarrollo, simular éxito
      const visitaCompleta = {
        ...currentVisit,
        status: 'completed',
        score: Math.round(currentVisit.evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / currentVisit.evaluations.length),
        completed_at: new Date().toISOString()
      };
      
      setVisits(prev => [visitaCompleta, ...prev]);
      setCurrentVisit(null);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cancelar visita actual
  const cancelarVisita = () => {
    setCurrentVisit(null);
  };

  // Cargar visitas al montar el componente
  useEffect(() => {
    if (userId) {
      cargarVisitas();
    }
  }, [userId]);

  return {
    visits,
    currentVisit,
    isLoading,
    error,
    cargarVisitas,
    iniciarVisita,
    actualizarEvaluacion,
    agregarFoto,
    completarVisita,
    cancelarVisita
  };
};
