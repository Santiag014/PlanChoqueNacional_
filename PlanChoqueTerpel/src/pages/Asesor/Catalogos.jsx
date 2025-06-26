import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useCatalogos } from '../../hooks/useCatalogos';
import CatalogList from '../../components/Asesor/Catalogos/CatalogList';
import oiltecImg from '../../assets/Iconos/IconosCatalogos/OILTEC.png';
import celerityImg from '../../assets/Iconos/IconosCatalogos/CELERITY.png';
import planpdvImg from '../../assets/Iconos/IconosCatalogos/KV_VISIONARIOS-NUEVO.jpg';
import '../../styles/Asesor/catalogos.css';

/**
 * Página de Catálogos del Asesor
 */
export default function Catalogos() {
  const { catalogos, handleDownload } = useCatalogos();

  // Actualizar las imágenes en el hook
  const catalogosWithImages = catalogos.map((cat, idx) => {
    const images = [oiltecImg, celerityImg, planpdvImg];
    return { ...cat, img: images[idx] };
  });

  return (
    <DashboardLayout>
      <CatalogList 
        catalogos={catalogosWithImages}
        onDownload={handleDownload}
      />
    </DashboardLayout>
  );
}