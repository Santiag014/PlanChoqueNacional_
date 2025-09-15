import React from 'react';

/**
 * Componente para la tabla de productos acumulados
 */
const AccumulatedTable = ({ 
  acumulados, 
  kpiSeleccionado, 
  handleEliminar, 
  totalCantidad, 
  totalGalones, 
  formatCOP 
}) => {
  if (acumulados.length === 0) return null;

  const renderTableHeaders = () => {
    if (kpiSeleccionado === 'Volumen') {
      return (
        <tr>
          <th>Referencia</th>
          <th>Presentación</th>
          <th>Cantidad</th>
          <th>Gal</th>
          <th></th>
        </tr>
      );
    } else if (kpiSeleccionado === 'Precio') {
      return (
        <tr>
          <th>Referencia</th>
          <th>Presentación</th>
          <th>Precio</th>
          <th></th>
        </tr>
      );
    }
    return null;
  };

  const renderTableRows = () => {
    return acumulados.map((a) => (
      <tr key={a.id + a.presentacion}>
        <td className="fs-10">{a.descripcion}</td>
        <td className="fs-10">{a.presentacion}</td>
        {kpiSeleccionado === 'Volumen' && (
          <>
            <td className="fs-10 ta-center">{a.cantidad}</td>
            <td className="fs-10 ta-center">{a.galones}</td>
          </>
        )}
        {kpiSeleccionado === 'Precio' && (
          <td className="fs-10 ta-center">{formatCOP(a.precio)}</td>
        )}
        <td>
          <button
            className="color-e30613 fw-700 cursor-pointer fs-13"
            title="Eliminar"
            onClick={() => handleEliminar(a.id, a.presentacion)}
          >
            ✕
          </button>
        </td>
      </tr>
    ));
  };

  const renderTableFooter = () => {
    if (kpiSeleccionado === 'Volumen') {
      return (
        <tfoot>
          <tr>
            <td colSpan={2} className="fw-700 fs-11 ta-right color-e30613">Totales</td>
            <td className="fw-700 fs-11 color-e30613 ta-center">{totalCantidad}</td>
            <td className="fw-700 fs-11 color-e30613 ta-center">{totalGalones}</td>
            <td></td>
          </tr>
        </tfoot>
      );
    }
    return null;
  };

  return (
    <div className="mt-10 w-100">
      <table className="tabla-acumulados">
        <thead>
          {renderTableHeaders()}
        </thead>
        <tbody>
          {renderTableRows()}
        </tbody>
        {renderTableFooter()}
      </table>
    </div>
  );
};

export default AccumulatedTable;
