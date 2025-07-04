import { useState, useEffect } from 'react';

/**
 * Hook personalizado para manejar KPIs y productos acumulados
 * @param {Object} productSelection - Información de productos y marcas seleccionadas
 * @returns {Object} Estados y funciones para manejo de KPIs
 */
export const useKpiManagement = (productSelection = {}) => {
  const kpis = ['Volumen', 'Precio', 'Frecuencia'];
  const [kpiSeleccionado, setKpiSeleccionado] = useState('');
  const [acumulados, setAcumulados] = useState([]);
  const [kpiTransition, setKpiTransition] = useState(false);

  // Estados para KPI Volumen
  const [cant14, setCant14] = useState('');
  const [cant1, setCant1] = useState('');
  const [cant55, setCant55] = useState('');
  const [total, setTotal] = useState(0);

  // Estados para KPI Precio
  const [precioSeleccion, setPrecioSeleccion] = useState(''); // '1/4', '1Gal', '55Gal'
  const [precioValor, setPrecioValor] = useState('');

  // Estados comunes
  const [fecha, setFecha] = useState('');
  const [foto, setFoto] = useState(null);

  // Función para obtener presentaciones dinámicas según la marca
  const getPresentacionesDinamicas = () => {
    const marcaActual = productSelection.marcas?.[productSelection.marcaActiva];
    if (!marcaActual) {
      return [
        { key: 'cant14', label: '1/4', galones: 0.25 },
        { key: 'cant1', label: '1Gal', galones: 1 },
        { key: 'cant55', label: '55Gal', galones: 55 }
      ];
    }

    const marcaNombre = marcaActual.descripcion || marcaActual.nombre || marcaActual.name || marcaActual.marca || '';
    const marcaNombreLower = marcaNombre.toLowerCase();

    if (marcaNombreLower.includes('celerity')) {
      return [
        { key: 'cant14', label: '1L', galones: 0.26 }, // 1 litro ≈ 0.26 galones
        { key: 'cant1', label: '1/4gal', galones: 0.25 },
        { key: 'cant55', label: '5gal', galones: 5 }
      ];
    } else if (marcaNombreLower.includes('oiltec')) {
      return [
        { key: 'cant14', label: '1/4gal', galones: 0.25 },
        { key: 'cant1', label: '1gal', galones: 1 },
        { key: 'cant55', label: '55gal', galones: 55 }
      ];
    }

    // Por defecto
    return [
      { key: 'cant14', label: '1/4', galones: 0.25 },
      { key: 'cant1', label: '1Gal', galones: 1 },
      { key: 'cant55', label: '55Gal', galones: 55 }
    ];
  };

  // Transición suave al cambiar KPI
  useEffect(() => {
    setKpiTransition(true);
    const t = setTimeout(() => setKpiTransition(false), 350);
    return () => clearTimeout(t);
  }, [kpiSeleccionado]);

  // Reiniciar datos al cambiar KPI
  useEffect(() => {
    setAcumulados([]);
    setCant14('');
    setCant1('');
    setCant55('');
    setPrecioSeleccion('');
    setPrecioValor('');
    setFecha('');
    setFoto(null);
  }, [kpiSeleccionado]);

  // Calcular el total de productos ingresados
  useEffect(() => {
    const t = (parseInt(cant14) || 0) + (parseInt(cant1) || 0) + (parseInt(cant55) || 0);
    setTotal(t);
  }, [cant14, cant1, cant55]);

  // Handler para seleccionar KPI con validación
  const handleSeleccionarKPI = (kpi) => {
    // La validación ahora se maneja en el componente KpiSelector con el disabled
    setKpiSeleccionado(kpi);
  };

  // Resetear KPI seleccionado si el PDV no es válido
  const resetKpiSiInvalido = (puedeSeleccionarKPI) => {
    if (!puedeSeleccionarKPI && kpiSeleccionado) {
      setKpiSeleccionado('');
    }
  };

  /**
   * Agrega cantidades de producto al acumulado (para KPI Volumen).
   */
  const handleCargarVolumen = (producto) => {
    if (!producto) return;

    let nuevosAcumulados = [...acumulados];
    const presentaciones = getPresentacionesDinamicas();

    presentaciones.forEach(pres => {
      const cantidad = parseInt(eval(pres.key)) || 0;
      if (cantidad > 0) {
        // Buscar si ya existe la fila
        const idx = nuevosAcumulados.findIndex(
          a => a.id === producto.id && a.presentacion === pres.label
        );
        if (idx >= 0) {
          nuevosAcumulados[idx].cantidad += cantidad;
          nuevosAcumulados[idx].galones += cantidad * pres.galones;
        } else {
          nuevosAcumulados.push({
            id: producto.id,
            descripcion: producto.descripcion,
            presentacion: pres.label,
            cantidad,
            galones: cantidad * pres.galones
          });
        }
      }
    });

    setAcumulados(nuevosAcumulados);

    // Limpiar inputs de cantidad
    setCant14('');
    setCant1('');
    setCant55('');
  };

  /**
   * Agrega precio de producto al acumulado (para KPI Precio).
   */
  const handleCargarPrecio = (producto) => {
    if (!producto) return;
    if (!precioSeleccion || !precioValor) return;
    
    let nuevosAcumulados = [...acumulados];
    const idx = nuevosAcumulados.findIndex(
      a => a.id === producto.id && a.presentacion === precioSeleccion
    );
    
    // Asegurar que tenemos el nombre correcto del producto
    const nombreProducto = producto.descripcion || producto.nombre || producto.name || 'Producto';
    
    if (idx >= 0) {
      nuevosAcumulados[idx].precio = precioValor;
    } else {
      nuevosAcumulados.push({
        id: producto.id,
        descripcion: nombreProducto,
        presentacion: precioSeleccion,
        precio: precioValor
      });
    }
    
    setAcumulados(nuevosAcumulados);
    setPrecioSeleccion('');
    setPrecioValor('');
  };

  /**
   * Elimina una referencia de la tabla de acumulados.
   */
  const handleEliminar = (id, presentacion) => {
    setAcumulados(acumulados.filter(a => !(a.id === id && a.presentacion === presentacion)));
  };

  // Calcular totales
  const totalCantidad = acumulados.reduce((sum, a) => sum + (a.cantidad || 0), 0);
  const totalGalones = acumulados.reduce((sum, a) => sum + (a.galones || 0), 0);

  /**
   * Formatea un número como moneda COP.
   */
  const formatCOP = (value) => {
    if (!value) return '';
    const num = Number(value.toString().replace(/\D/g, ''));
    if (!num) return '';
    return num.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  };

  // Handler para el input de precio (solo números)
  const handlePrecioInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setPrecioValor(raw);
  };

  return {
    kpis,
    kpiSeleccionado,
    acumulados,
    kpiTransition,
    cant14,
    setCant14,
    cant1,
    setCant1,
    cant55,
    setCant55,
    total,
    precioSeleccion,
    setPrecioSeleccion,
    precioValor,
    fecha,
    setFecha,
    foto,
    setFoto,
    handleSeleccionarKPI,
    resetKpiSiInvalido,
    handleCargarVolumen,
    handleCargarPrecio,
    handleEliminar,
    totalCantidad,
    totalGalones,
    formatCOP,
    handlePrecioInput
  };
};
