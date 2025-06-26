import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook personalizado para manejar la navegación del home
 * @returns {Object} Estados y funciones para la navegación
 */
export const useHomeNavigation = () => {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const handleNavigation = (route, pdfPath) => {
    if (route) {
      navigate(route);
    } else if (pdfPath) {
      // Descarga directa del PDF
      const link = document.createElement('a');
      link.href = pdfPath;
      link.download = '';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return {
    page,
    setPage,
    handleNavigation
  };
};
