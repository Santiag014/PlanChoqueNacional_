import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import oiltecImg from '../../assets/Iconos/IconosCatalogos/OILTEC.png';
import celerityImg from '../../assets/Iconos/IconosCatalogos/CELERITY.png';
import planpdvImg from '../../assets/Iconos/IconosCatalogos/CELERITY.png';
import '../../styles/catalogos.css'; // Importa el nuevo CSS

const catalogos = [
  {
    titulo: 'CATÁLOGO OILTEC',
    img: oiltecImg,
    link: '/catalogos/oiltec.pdf'
  },
  {
    titulo: 'CATÁLOGO CELERITY',
    img: celerityImg,
    link: '/catalogos/celerity.pdf'
  },
  {
    titulo: 'CATÁLOGO PLAN PDV',
    img: planpdvImg,
    link: '/catalogos/planpdv.pdf'
  }
];

export default function Catalogos() {
  return (
    <DashboardLayout>
      <div className="catalogos-bg">
        {/* Tarjetas de catálogos */}
        <div className="catalogos-list">
          {catalogos.map((cat, idx) => (
            <div className="catalogo-card" key={idx}>
              <div className="catalogo-title">{cat.titulo}</div>
              <img src={cat.img} alt={cat.titulo} className="catalogo-img" />
              <a href={cat.link} download className="catalogo-link">
                <button className="catalogo-btn">
                  DESCARGA
                </button>
              </a>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}