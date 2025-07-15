import { useState, useEffect } from 'react';

// Hook para manejar responsive design
export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerWidth = isMobile ? '90vw' : 420;

  return {
    isMobile,
    containerWidth
  };
};
