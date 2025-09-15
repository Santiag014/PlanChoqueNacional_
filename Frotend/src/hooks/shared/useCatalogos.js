import { useState } from 'react';

/**
 * Hook personalizado para manejar los catálogos
 * @returns {Object} Estados y funciones para los catálogos
 */
export const useCatalogos = () => {
  const [catalogos] = useState([
    {
      titulo: 'CATÁLOGO PLAN PDV',
      img: '/src/assets/Iconos/IconosCatalogos/KV_VISIONARIOS-NUEVO.jpg',
      link: '/catalogos/planpdv.pdf'
    },
    {
      titulo: 'CATÁLOGO OILTEC',
      img: '/src/assets/Iconos/IconosCatalogos/OILTEC.png',
      link: 'https://drive.google.com/uc?export=download&id=1WkqETK73HcfUBoI0s_UUF1vlBsgKQCGT'
    },
    {
      titulo: 'CATÁLOGO CELERITY',
      img: '/src/assets/Iconos/IconosCatalogos/CELERITY.png',
      link: 'https://drive.google.com/uc?export=download&id=1gR79U5ciRXYCVy0lOFEqeuXuf57mt7vg'
    }
  ]);

  const handleDownload = (link, titulo) => {
    // Si es una URL de Google Drive, abrir en nueva pestaña para descarga directa
    if (link.includes('drive.google.com')) {
      window.open(link, '_blank');
    } else {
      // Para otros enlaces, usar el método tradicional
      const linkElement = document.createElement('a');
      linkElement.href = link;
      linkElement.download = titulo || '';
      linkElement.target = '_blank';
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
    }
  };

  return {
    catalogos,
    handleDownload
  };
};
