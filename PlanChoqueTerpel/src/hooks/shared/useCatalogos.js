import { useState } from 'react';

/**
 * Hook personalizado para manejar los catálogos
 * @returns {Object} Estados y funciones para los catálogos
 */
export const useCatalogos = () => {
  const [catalogos] = useState([
    {
      titulo: 'CATÁLOGO OILTEC',
      img: '/src/assets/Iconos/IconosCatalogos/OILTEC.png',
      link: '/catalogos/oiltec.pdf'
    },
    {
      titulo: 'CATÁLOGO CELERITY',
      img: '/src/assets/Iconos/IconosCatalogos/CELERITY.png',
      link: '/catalogos/celerity.pdf'
    },
    {
      titulo: 'CATÁLOGO PLAN PDV',
      img: '/src/assets/Iconos/IconosCatalogos/KV_VISIONARIOS-NUEVO.jpg',
      link: '/catalogos/planpdv.pdf'
    }
  ]);

  const handleDownload = (link) => {
    const linkElement = document.createElement('a');
    linkElement.href = '/docs/catalogos.pdf'; // Ruta real del PDF
    linkElement.download = '';
    linkElement.target = '_blank';
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  return {
    catalogos,
    handleDownload
  };
};
