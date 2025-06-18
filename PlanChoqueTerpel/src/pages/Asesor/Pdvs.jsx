import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { API_URL } from '../../config';
import '../../styles/Asesor/pdv.css';

export default function Pdvs() {
  const navigate = useNavigate();

  // Obtener usuario logueado de localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // Redirigir si no hay usuario logueado
  useEffect(() => {
    if (!userId) {
      navigate('/');
    }
  }, [userId, navigate]);

  const [marcas, setMarcas] = useState([]);
  const [marcaActiva, setMarcaActiva] = useState(0);
  const [productos, setProductos] = useState([]);
  const [productoActivo, setProductoActivo] = useState(0);
  const [loadingMarcas, setLoadingMarcas] = useState(true);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [codigoPDV, setCodigoPDV] = useState('');
  const [correspondeA, setCorrespondeA] = useState('');
  const [loadingPDV, setLoadingPDV] = useState(false);

  // Cantidades
  const [cant14, setCant14] = useState('');
  const [cant1, setCant1] = useState('');
  const [cant55, setCant55] = useState('');
  const [total, setTotal] = useState(0);
  const [valorFactura, setValorFactura] = useState('');
  const [fecha, setFecha] = useState('');
  const [foto, setFoto] = useState(null);

  // KPI
  const kpis = ['Volumen', 'Precio', 'Frecuencia'];
  const [kpiSeleccionado, setKpiSeleccionado] = useState('');

  // Carrusel
  const [carruselInicio, setCarruselInicio] = useState(0);
  const referenciasVisibles = 2; // Mostrar solo 2 referencias a la vez

  // Cargar marcas al iniciar
  useEffect(() => {
    setLoadingMarcas(true);
    fetch(`${API_URL}/api/marcas`)
      .then(res => res.json())
      .then(data => {
        setMarcas(data);
        setLoadingMarcas(false);
        setMarcaActiva(0);
      });
  }, []);

  // Cargar productos cuando cambia la marca activa
  useEffect(() => {
    if (!marcas.length) return;
    setLoadingProductos(true);
    fetch(`${API_URL}/api/referencias?marca_id=${marcas[marcaActiva]?.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.data)) {
          setProductos(data.data);
        } else {
          setProductos([]);
        }
        setProductoActivo(0);
        setLoadingProductos(false);
      })
      .catch(() => {
        setProductos([]);
        setProductoActivo(0);
        setLoadingProductos(false);
      });
  }, [marcaActiva, marcas]);

  // Cuando cambia el código, busca la descripción (ahora usando userId)
  useEffect(() => {
    if (!codigoPDV) {
      setCorrespondeA('');
      return;
    }
    setLoadingPDV(true);
    fetch(`${API_URL}/api/pdv-desc?codigo=${codigoPDV}&user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.descripcion) {
          setCorrespondeA(data.descripcion);
        } else {
          setCorrespondeA('N/A');
        }
        setLoadingPDV(false);
      })
      .catch(() => {
        setCorrespondeA('N/A');
        setLoadingPDV(false);
      });
  }, [codigoPDV, userId]);

  // Calcular total
  useEffect(() => {
    const t = (parseInt(cant14) || 0) + (parseInt(cant1) || 0) + (parseInt(cant55) || 0);
    setTotal(t);
  }, [cant14, cant1, cant55]);

  // Cuando cambian los productos, reinicia el carrusel
  useEffect(() => {
    setCarruselInicio(0);
  }, [productos]);

  // Estado para la tabla de acumulados
  const [acumulados, setAcumulados] = useState([]);

  // Para KPI Precio
  const [precioSeleccion, setPrecioSeleccion] = useState(''); // '1/4', '1Gal', '55Gal'
  const [precioValor, setPrecioValor] = useState('');

  // Formatear como COP
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

  // Presentaciones
  const presentaciones = [
    { key: 'cant14', label: '1/4', galones: 0.25 },
    { key: 'cant1', label: '1Gal', galones: 1 },
    { key: 'cant55', label: '55Gal', galones: 55 }
  ];

  // Handler para cargar cantidades (Volumen)
  const handleCargar = () => {
    const prod = productos[productoActivo];
    if (!prod) return;

    let nuevosAcumulados = [...acumulados];

    presentaciones.forEach(pres => {
      const cantidad = parseInt(eval(pres.key)) || 0;
      if (cantidad > 0) {
        // Buscar si ya existe la fila
        const idx = nuevosAcumulados.findIndex(
          a => a.id === prod.id && a.presentacion === pres.label
        );
        if (idx >= 0) {
          nuevosAcumulados[idx].cantidad += cantidad;
          nuevosAcumulados[idx].galones += cantidad * pres.galones;
        } else {
          nuevosAcumulados.push({
            id: prod.id,
            descripcion: prod.descripcion,
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

  // Handler para cargar precios (Precio)
  const handleCargarPrecio = () => {
    const prod = productos[productoActivo];
    if (!prod) return;
    if (!precioSeleccion || !precioValor) return;
    let nuevosAcumulados = [...acumulados];
    const idx = nuevosAcumulados.findIndex(
      a => a.id === prod.id && a.presentacion === precioSeleccion
    );
    if (idx >= 0) {
      nuevosAcumulados[idx].precio = precioValor;
    } else {
      nuevosAcumulados.push({
        id: prod.id,
        descripcion: prod.descripcion,
        presentacion: precioSeleccion,
        precio: precioValor
      });
    }
    setAcumulados(nuevosAcumulados);
    setPrecioSeleccion('');
    setPrecioValor('');
  };

  // Calcular total general en cantidad de productos (no galones)
  const totalCantidad = acumulados.reduce((sum, a) => sum + a.cantidad, 0);
  // Calcular total general en galones
  const totalGalones = acumulados.reduce((sum, a) => sum + a.galones, 0);

  // Reiniciar inputs al cambiar productoActivo
  useEffect(() => {
    setCant14('');
    setCant1('');
    setCant55('');
  }, [productoActivo]);

  // Función para recortar el nombre de la referencia
  const recortarNombre = (nombre, max = 18) => {
    if (!nombre) return '';
    return nombre.length > max ? nombre.slice(0, max) + '...' : nombre;
  };

  // Handlers
  const handleFoto = e => setFoto(e.target.files[0]);

  // Para placeholder custom en fecha
  const [focusFecha, setFocusFecha] = useState(false);

  // Eliminar una referencia de la tabla
  const handleEliminar = (id, presentacion) => {
    setAcumulados(acumulados.filter(a => !(a.id === id && a.presentacion === presentacion)));
  };

  // Construir el array final de reporte
  const reporteFinal = {
    codigoPDV,
    correspondeA,
    kpi: kpiSeleccionado,
    fecha,
    foto,
    productos: acumulados.map(a => {
      if (kpiSeleccionado === 'Precio') {
        return {
          id: a.id,
          descripcion: a.descripcion,
          presentacion: a.presentacion,
          precio: a.precio
        };
      } else if (kpiSeleccionado === 'Volumen') {
        return {
          id: a.id,
          descripcion: a.descripcion,
          presentacion: a.presentacion,
          cantidad: a.cantidad,
          galones: a.galones
        };
      }
      return {
        id: a.id,
        descripcion: a.descripcion,
        presentacion: a.presentacion
      };
    })
  };

  // Mostrar el array en pantalla (puedes ocultar esto si solo quieres consola)
  const [mostrarArray, setMostrarArray] = useState(false);

  const handleVerArray = () => {
    setMostrarArray(!mostrarArray);
    console.log(reporteFinal);
  };

  const [subiendo, setSubiendo] = useState(false);

  // Handler para cargar el reporte
  const handleCargarReporte = async () => {
    // Validaciones
    if (!codigoPDV) {
      alert('Debe ingresar el código PDV.');
      return;
    }
    if (!kpiSeleccionado) {
      alert('Debe seleccionar el KPI.');
      return;
    }
    if (!fecha) {
      alert('Debe seleccionar la fecha.');
      return;
    }
    if (!foto) {
      alert('Debe adjuntar una foto.');
      return;
    }
    if (kpiSeleccionado !== 'Frecuencia' && !acumulados.length) {
      alert('Debe agregar al menos un producto.');
      return;
    }
    if (correspondeA === 'N/A' || !correspondeA) {
      alert('El código PDV no es válido.');
      return;
    }

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('codigoPDV', codigoPDV);
      formData.append('correspondeA', correspondeA);
      formData.append('kpi', kpiSeleccionado);
      formData.append('fecha', fecha);
      formData.append('userId', userId);
      if (foto) formData.append('foto', foto);
      if (kpiSeleccionado !== 'Frecuencia') {
        formData.append('productos', JSON.stringify(reporteFinal.productos));
      } else {
        formData.append('productos', JSON.stringify([]));
      }

      const res = await fetch(`${API_URL}/api/cargar-registro-pdv`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setSubiendo(false);
      if (data.success) {
        alert(data.message || 'Registro guardado correctamente');
        window.location.reload(); // Recarga la página tras éxito
      } else {
        alert(data.message || 'Error al guardar');
      }
    } catch (err) {
      setSubiendo(false);
      alert('Error al guardar el registro');
    }
  };

  // Transición suave al cambiar KPI
  const [kpiTransition, setKpiTransition] = useState(false);
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
    setMostrarArray(false);
    // ...otros resets si es necesario...
  }, [kpiSeleccionado]);

  return (
    <DashboardLayout>
      <div className="pdv-main-box">
        {/* Spinner de carga */}
        {subiendo && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <div className="spinner-red" style={{ width: 36, height: 36, borderWidth: 5 }} />
          </div>
        )}
        {/* Fila: CÓDIGO PDV */}
        <div className="pdv-row">
          <label className="pdv-label">
            CÓDIGO PDV
          </label>
          <input
            className="pdv-input-codigo"
            type="text"
            value={codigoPDV}
            onChange={e => setCodigoPDV(e.target.value)}
            placeholder="Ej: 221"
            autoFocus
          />
        </div>
        {/* Fila: CORRESPONDE A */}
        <div className="pdv-row">
          <label className="pdv-label">
            CORRESPONDE A
          </label>
          <input
            className="pdv-input-corresponde"
            type="text"
            value={correspondeA}
            placeholder="Ej: Lubricantes Terpel"
            readOnly
            style={correspondeA === 'N/A' ? { color: '#e30613', fontWeight: 'bold' } : {}}
          />
        </div>

        {/* Sección KPI */}
        <div className="kpi-section">
          <div className="kpi-label">KPI A REGISTRAR</div>
          <div className="kpi-options">
            {kpis.map(kpi => (
              <button
                key={kpi}
                className={`kpi-btn${kpiSeleccionado === kpi ? ' active' : ''}`}
                onClick={() => setKpiSeleccionado(kpi)}
                type="button"
              >
                {kpi}
              </button>
            ))}
          </div>
        </div>

        {/* Mostrar solo si hay KPI seleccionado */}
        {kpiSeleccionado === 'Volumen' && (
          <div>
            {/* Sección VENTA PRODUCTOS */}
            <div className={`kpi-section kpi-transition${kpiTransition ? ' kpi-fade' : ''}`}>
              <div className='venta-productos-label'>
                VENTA PRODUCTOS</div>
              {/* Selector de marca */}
              <div className="productos-selector">
                <button
                  type="button"
                  className="productos-arrow"
                  onClick={() => setMarcaActiva(marcaActiva > 0 ? marcaActiva - 1 : marcas.length - 1)}
                >◀</button>
                <button
                  type="button"
                  className="productos-marca"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <span>
                    {marcas[marcaActiva]?.descripcion || 'Marca'}
                  </span>
                </button>
                <button
                  type="button"
                  className="productos-arrow"
                  onClick={() => setMarcaActiva((marcaActiva + 1) % marcas.length)}
                >▶</button>
              </div>
              {/* Carrusel de productos */}
              <div className="productos-lista-carrusel" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
                <button
                  type="button"
                  className="carrusel-arrow"
                  style={{ visibility: productos.length > referenciasVisibles ? 'visible' : 'hidden' }}
                  onClick={() => setCarruselInicio(Math.max(0, carruselInicio - referenciasVisibles))}
                  disabled={carruselInicio === 0}
                >
                  <span style={{ fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◀</span>
                </button>
                {productos.slice(carruselInicio, carruselInicio + referenciasVisibles).map((prod, idx) => {
                  const realIdx = carruselInicio + idx;
                  return (
                    <div
                      key={prod.id}
                      className={`producto-item${productoActivo === realIdx ? ' selected' : ''}`}
                      onClick={() => setProductoActivo(realIdx)}
                      style={{
                        width: 120,
                        margin: '0 8px',
                        overflow: 'hidden',
                        textAlign: 'center',
                      }}
                    >
                      <img src={prod.imagen || '/img/logo-prueba.png'} alt={prod.descripcion} style={{ width: 60, height: 60, objectFit: 'contain' }} />
                      <div
                        className="producto-item-label"
                        style={{
                          color: productoActivo === realIdx ? '#e30613' : '#222',
                          fontSize: 11,
                          marginTop: 4,
                          whiteSpace: 'normal',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: '100%',
                          minHeight: 20,
                          wordBreak: 'break-word',
                          lineHeight: '1.1',
                          maxHeight: 28,
                          display: 'block',
                        }}
                        title={prod.descripcion}
                      >
                        {prod.descripcion}
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="carrusel-arrow"
                  style={{ visibility: productos.length > referenciasVisibles ? 'visible' : 'hidden' }}
                  onClick={() => setCarruselInicio(Math.min(productos.length - referenciasVisibles, carruselInicio + referenciasVisibles))}
                  disabled={carruselInicio >= productos.length - referenciasVisibles}
                >
                  <span style={{ fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</span>
                </button>
              </div>
              {/* Inputs de cantidades */}
              <div className="cantidades-section">
                <span className="cant-label">1/4</span>
                <input
                  type="number"
                  min="0"
                  className="cant-input"
                  value={cant14}
                  onChange={e => setCant14(e.target.value)}
                  placeholder="0"
                />
                <span className="cant-label">1Gal</span>
                <input
                  type="number"
                  min="0"
                  className="cant-input"
                  value={cant1}
                  onChange={e => setCant1(e.target.value)}
                  placeholder="0"
                />
                <span className="cant-label">55Gal</span>
                <input
                  type="number"
                  min="0"
                  className="cant-input"
                  value={cant55}
                  onChange={e => setCant55(e.target.value)}
                  placeholder="0"
                />
                <span className="cant-label" style={{ marginLeft: 4, marginRight: 2 }}>Total</span>
                <span className="cant-total">{totalCantidad}</span>
              </div>
              <button
                type="button"
                className="cargar-btn"
                style={{ marginLeft: 8 }}
                onClick={handleCargar}
              >
                CARGAR
              </button>
              {/* Botón para mostrar el array */}
              {/* <button
                type="button"
                className="cargar-btn"
                style={{ marginLeft: 8, marginTop: 8, background: '#b9000e' }}
                onClick={handleVerArray}
              >
                VER ARRAY
              </button> */}
              {/* Mostrar el array en pantalla */}
              {/* {mostrarArray && (
                <pre style={{
                  background: '#fff6f7',
                  color: '#e30613',
                  fontSize: 11,
                  padding: 8,
                  borderRadius: 8,
                  margin: '10px 0',
                  maxWidth: '100%',
                  overflowX: 'auto'
                }}>
                  {JSON.stringify(reporteFinal, null, 2)}
                </pre>
              )} */}
              {/* Tabla de acumulados */}
              {acumulados.length > 0 && (
                <div style={{ marginTop: 10, width: '100%' }}>
                  <table className="tabla-acumulados">
                    <thead>
                      <tr>
                        <th>Referencia</th>
                        <th>Presentación</th>
                        <th>Cantidad</th>
                        <th>Gal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {acumulados.map((a, i) => (
                        <tr key={a.id + a.presentacion}>
                          <td style={{ fontSize: 10 }}>{a.descripcion}</td>
                          <td style={{ fontSize: 10 }}>{a.presentacion}</td>
                          <td style={{ fontSize: 10, textAlign: 'center' }}>{a.cantidad}</td>
                          <td style={{ fontSize: 10, textAlign: 'center' }}>{a.galones}</td>
                          <td>
                            <button
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#e30613',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: 14,
                                padding: 0
                              }}
                              title="Eliminar"
                              onClick={() => handleEliminar(a.id, a.presentacion)}
                            >✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} style={{ fontWeight: 700, fontSize: 11, textAlign: 'right', color: '#e30613' }}>Totales</td>
                        <td style={{ fontWeight: 700, fontSize: 11, color: '#e30613', textAlign: 'center' }}>{totalCantidad}</td>
                        <td style={{ fontWeight: 700, fontSize: 11, color: '#e30613', textAlign: 'center' }}>{totalGalones}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
              {/* Fecha y foto */}
              <div className="pdv-row">
                <label className="pdv-label">
                  FECHA
                </label>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    className="pdv-input-date"
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    style={{ textAlign: 'center' }}
                  />
                  <span className="date-icon" style={{ cursor: 'pointer' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="#fff" strokeWidth="2"/>
                      <rect x="7" y="2" width="2" height="4" rx="1" fill="#fff"/>
                      <rect x="15" y="2" width="2" height="4" rx="1" fill="#fff"/>
                      <rect x="3" y="9" width="18" height="2" fill="#fff"/>
                    </svg>
                  </span>
                </div>
              </div>
              <div className="pdv-row">
                <label className="pdv-label">
                  ADJUNTAR FOTO
                </label>
                <div className="adjuntar-foto-box">
                  <input
                    type="file"
                    accept="image/*"
                    id="foto-input"
                    style={{ display: 'none' }}
                    onChange={handleFoto}
                  />
                  <div
                    className="adjuntar-foto-input"
                    tabIndex={0}
                    onClick={() => document.getElementById('foto-input').click()}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="foto-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="5" width="18" height="14" rx="3" fill="#e30613" stroke="#fff" strokeWidth="1.5"/>
                        <circle cx="12" cy="12" r="3" fill="#fff"/>
                        <rect x="7" y="2" width="2" height="4" rx="1" fill="#fff"/>
                        <rect x="15" y="2" width="2" height="4" rx="1" fill="#fff"/>
                      </svg>
                    </span>
                    <span className="adjuntar-foto-placeholder">
                      {foto ? foto.name : "Seleccionar foto"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="cargar-report-btn"
                style={{ marginLeft: 8 }}
                onClick={handleCargarReporte}
                disabled={subiendo}
              >
                CARGAR REPORTE
              </button>
            </div>
          </div>
        )}

        {kpiSeleccionado === 'Precio' && (
          <div>
            <div className={`kpi-section kpi-transition${kpiTransition ? ' kpi-fade' : ''}`}>
              <div className='venta-productos-label'>
                VENTA PRODUCTOS</div>
              {/* Selector de marca */}
              <div className="productos-selector">
                <button
                  type="button"
                  className="productos-arrow"
                  onClick={() => setMarcaActiva(marcaActiva > 0 ? marcaActiva - 1 : marcas.length - 1)}
                >◀</button>
                <button
                  type="button"
                  className="productos-marca"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <span>
                    {marcas[marcaActiva]?.descripcion || 'Marca'}
                  </span>
                </button>
                <button
                  type="button"
                  className="productos-arrow"
                  onClick={() => setMarcaActiva((marcaActiva + 1) % marcas.length)}
                >▶</button>
              </div>
              {/* Carrusel de productos */}
              <div className="productos-lista-carrusel" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
                <button
                  type="button"
                  className="carrusel-arrow"
                  style={{ visibility: productos.length > referenciasVisibles ? 'visible' : 'hidden' }}
                  onClick={() => setCarruselInicio(Math.max(0, carruselInicio - referenciasVisibles))}
                  disabled={carruselInicio === 0}
                >
                  <span style={{ fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◀</span>
                </button>
                {productos.slice(carruselInicio, carruselInicio + referenciasVisibles).map((prod, idx) => {
                  const realIdx = carruselInicio + idx;
                  return (
                    <div
                      key={prod.id}
                      className={`producto-item${productoActivo === realIdx ? ' selected' : ''}`}
                      onClick={() => setProductoActivo(realIdx)}
                      style={{
                        width: 120,
                        margin: '0 8px',
                        overflow: 'hidden',
                        textAlign: 'center',
                      }}
                    >
                      <img src={prod.imagen || '/img/logo-prueba.png'} alt={prod.descripcion} style={{ width: 60, height: 60, objectFit: 'contain' }} />
                      <div
                        className="producto-item-label"
                        style={{
                          color: productoActivo === realIdx ? '#e30613' : '#222',
                          fontSize: 11,
                          marginTop: 4,
                          whiteSpace: 'normal',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          width: '100%',
                          minHeight: 20,
                          wordBreak: 'break-word',
                          lineHeight: '1.1',
                          maxHeight: 28,
                          display: 'block',
                        }}
                        title={prod.descripcion}
                      >
                        {prod.descripcion}
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="carrusel-arrow"
                  style={{ visibility: productos.length > referenciasVisibles ? 'visible' : 'hidden' }}
                  onClick={() => setCarruselInicio(Math.min(productos.length - referenciasVisibles, carruselInicio + referenciasVisibles))}
                  disabled={carruselInicio >= productos.length - referenciasVisibles}
                >
                  <span style={{ fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</span>
                </button>
              </div>
              {/* Presentaciones y precio */}
              <div className="precio-section" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                {['1/4', '1Gal', '55Gal'].map(pres => (
                  <div key={pres} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="checkbox"
                      checked={precioSeleccion === pres}
                      onChange={() => setPrecioSeleccion(precioSeleccion === pres ? '' : pres)}
                      id={`check-${pres}`}
                    />
                    <label htmlFor={`check-${pres}`} style={{ fontSize: 13 }}>{pres}</label>
                  </div>
                ))}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="cant-input"
                  value={precioValor ? formatCOP(precioValor) : ''}
                  onChange={handlePrecioInput}
                  placeholder="$"
                  style={{ width: 110 }}
                  disabled={!precioSeleccion}
                />
                <span style={{ fontWeight: 700, color: '#222' }}>COP</span>
              </div>
              <div style={{ marginTop: 10, marginBottom: 0 }}>
                <button
                  type="button"
                  className="cargar-btn"
                  style={{ marginLeft: 0 }}
                  onClick={handleCargarPrecio}
                  disabled={!precioSeleccion || !precioValor}
                >
                  CARGAR
                </button>
              </div>
              {/* Tabla de acumulados */}
              {acumulados.length > 0 && (
                <div style={{ marginTop: 10, width: '100%' }}>
                  <table className="tabla-acumulados">
                    <thead>
                      <tr>
                        <th>Referencia</th>
                        <th>Presentación</th>
                        <th>Precio</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {acumulados.map((a, i) => (
                        <tr key={a.id + a.presentacion}>
                          <td style={{ fontSize: 10 }}>{a.descripcion}</td>
                          <td style={{ fontSize: 10 }}>{a.presentacion}</td>
                          <td style={{ fontSize: 10, textAlign: 'center' }}>{formatCOP(a.precio)}</td>
                          <td>
                            <button
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#e30613',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: 14,
                                padding: 0
                              }}
                              title="Eliminar"
                              onClick={() => handleEliminar(a.id, a.presentacion)}
                            >✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Fecha y foto */}
              <div className="pdv-row">
                <label className="pdv-label">
                  FECHA
                </label>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    className="pdv-input-date"
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    style={{ textAlign: 'center' }}
                  />
                  <span className="date-icon" style={{ cursor: 'pointer' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="#fff" strokeWidth="2"/>
                      <rect x="7" y="2" width="2" height="4" rx="1" fill="#fff"/>
                      <rect x="15" y="2" width="2" height="4" rx="1" fill="#fff"/>
                      <rect x="3" y="9" width="18" height="2" fill="#fff"/>
                    </svg>
                  </span>
                </div>
              </div>
              <div className="pdv-row">
                <label className="pdv-label">
                  ADJUNTAR FOTO
                </label>
                <div className="adjuntar-foto-box">
                  <input
                    type="file"
                    accept="image/*"
                    id="foto-input"
                    style={{ display: 'none' }}
                    onChange={handleFoto}
                  />
                  <div
                    className="adjuntar-foto-input"
                    tabIndex={0}
                    onClick={() => document.getElementById('foto-input').click()}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="foto-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="5" width="18" height="14" rx="3" fill="#e30613" stroke="#fff" strokeWidth="1.5"/>
                        <circle cx="12" cy="12" r="3" fill="#fff"/>
                        <rect x="7" y="2" width="2" height="4" rx="1" fill="#fff"/>
                        <rect x="15" y="2" width="2" height="4" rx="1" fill="#fff"/>
                      </svg>
                    </span>
                    <span className="adjuntar-foto-placeholder">
                      {foto ? foto.name : "Seleccionar foto"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="cargar-report-btn"
                style={{ marginLeft: 8 }}
                onClick={handleCargarReporte}
                disabled={subiendo}
              >
                CARGAR REPORTE
              </button>
            </div>
          </div>
        )}

        {kpiSeleccionado === 'Frecuencia' && (
          <div>
            {/* Solo fecha y foto */}
            <div className="pdv-row">
              <label className="pdv-label">
                FECHA
              </label>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  className="pdv-input-date"
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  style={{ textAlign: 'center' }}
                />
                <span className="date-icon" style={{ cursor: 'pointer' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="#fff" strokeWidth="2"/>
                    <rect x="7" y="2" width="2" height="4" rx="1" fill="#fff"/>
                    <rect x="15" y="2" width="2" height="4" rx="1" fill="#fff"/>
                    <rect x="3" y="9" width="18" height="2" fill="#fff"/>
                  </svg>
                </span>
              </div>
            </div>
            <div className="pdv-row">
              <label className="pdv-label">
                ADJUNTAR FOTO
              </label>
              <div className="adjuntar-foto-box">
                <input
                  type="file"
                  accept="image/*"
                  id="foto-input"
                  style={{ display: 'none' }}
                  onChange={handleFoto}
                />
                <div
                  className="adjuntar-foto-input"
                  tabIndex={0}
                  onClick={() => document.getElementById('foto-input').click()}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="foto-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="5" width="18" height="14" rx="3" fill="#e30613" stroke="#fff" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="3" fill="#fff"/>
                      <rect x="7" y="2" width="2" height="4" rx="1" fill="#fff"/>
                      <rect x="15" y="2" width="2" height="4" rx="1" fill="#fff"/>
                    </svg>
                  </span>
                  <span className="adjuntar-foto-placeholder">
                    {foto ? foto.name : "Seleccionar foto"}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="cargar-report-btn"
              style={{ marginLeft: 8 }}
              onClick={handleCargarReporte}
              disabled={subiendo}
            >
              CARGAR REPORTE
            </button>
          </div>
        )}
        {/* Si no hay KPI seleccionado, NO mostrar fecha ni foto ni nada más */}
      </div>
    </DashboardLayout>
  );
}