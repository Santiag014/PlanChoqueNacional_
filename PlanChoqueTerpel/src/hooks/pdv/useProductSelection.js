import { useState, useEffect } from 'react';
import { API_URL } from '../../config.js';

/**
 * Hook personalizado para manejar la selección de productos
 * @returns {Object} Estados y funciones para la selección de productos
 */
export const useProductSelection = () => {
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [marcaActiva, setMarcaActiva] = useState(0);
  const [productoActivo, setProductoActivo] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para cargar marcas desde el API
  const cargarMarcas = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/marcas`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (response.ok) {
        const marcasData = await response.json();
        console.log('Marcas cargadas:', marcasData);
        setMarcas(marcasData || []);
        if (marcasData.length > 0) {
          setMarcaActiva(0);
          await cargarReferencias(marcasData[0].id);
        }
      } else {
        throw new Error(`Error HTTP: ${response.status}`);
      }
    } catch (err) {
      console.error('Error cargando marcas:', err);
      setError('Error al cargar marcas');
      // Fallback con datos mock
      const marcasMock = [
        { id: 1, descripcion: 'OILTEC' },
        { id: 2, descripcion: 'CELERITY' },
        { id: 3, descripcion: 'PLAN PDV' }
      ];
      setMarcas(marcasMock);
      setMarcaActiva(0);
      await cargarReferencias(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cargar referencias por marca desde el API
  const cargarReferencias = async (marcaId, kpiId = null) => {
    if (!marcaId) return;
    
    setIsLoading(true);
    setError(null);
    setTodosLosProductos([]); // Limpiar productos anteriores
    
    try {
      let url = `${API_URL}/api/referencias?marca_id=${marcaId}`;
      if (kpiId) {
        url += `&kpi_id=${kpiId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Referencias cargadas:', data);
        if (data.success && Array.isArray(data.data)) {
          setTodosLosProductos(data.data);
          setProductoActivo(0); // Resetear a primer producto
        } else {
          console.error('Error en respuesta de referencias:', data.message);
          setTodosLosProductos([]);
          setError('No se encontraron productos para esta marca');
        }
      } else {
        throw new Error(`Error HTTP: ${response.status}`);
      }
    } catch (err) {
      console.error('Error cargando referencias:', err);
      setTodosLosProductos([]);
      setError('Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cargar productos desde el API (deprecated - usar cargarMarcas y cargarReferencias)
  const cargarProductos = async () => {
    // Esta función ahora solo llama a cargarMarcas que a su vez carga las referencias
    await cargarMarcas();
  };

  // Función para agregar producto seleccionado
  const agregarProducto = (producto, cantidad = 1, precio = null) => {
    const productoSeleccionado = {
      id: producto.id,
      nombre: producto.nombre,
      cantidad: Number(cantidad),
      precio: precio || producto.precio,
      subtotal: (precio || producto.precio) * Number(cantidad)
    };

    setProductosSeleccionados(prev => {
      const existente = prev.find(p => p.id === producto.id);
      if (existente) {
        return prev.map(p => 
          p.id === producto.id 
            ? { ...productoSeleccionado, cantidad: p.cantidad + Number(cantidad) }
            : p
        );
      }
      return [...prev, productoSeleccionado];
    });
  };

  // Función para actualizar cantidad de producto
  const actualizarCantidad = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarProducto(productoId);
      return;
    }

    setProductosSeleccionados(prev =>
      prev.map(p =>
        p.id === productoId
          ? { ...p, cantidad: Number(nuevaCantidad), subtotal: p.precio * Number(nuevaCantidad) }
          : p
      )
    );
  };

  // Función para actualizar precio de producto
  const actualizarPrecio = (productoId, nuevoPrecio) => {
    setProductosSeleccionados(prev =>
      prev.map(p =>
        p.id === productoId
          ? { ...p, precio: Number(nuevoPrecio), subtotal: Number(nuevoPrecio) * p.cantidad }
          : p
      )
    );
  };

  // Función para eliminar producto
  const eliminarProducto = (productoId) => {
    setProductosSeleccionados(prev => prev.filter(p => p.id !== productoId));
  };

  // Función para limpiar selección
  const limpiarSeleccion = () => {
    setProductosSeleccionados([]);
  };

  // Función para obtener total
  const obtenerTotal = () => {
    return productosSeleccionados.reduce((total, producto) => total + producto.subtotal, 0);
  };

  // Funciones para navegación de marcas y productos
  const siguienteMarca = async (kpiId = null) => {
    const nuevaMarcaIndex = (marcaActiva + 1) % marcas.length;
    setMarcaActiva(nuevaMarcaIndex);
    setProductoActivo(0); // Reset producto al cambiar marca
    // Cargar referencias para la nueva marca
    if (marcas[nuevaMarcaIndex]) {
      await cargarReferencias(marcas[nuevaMarcaIndex].id, kpiId);
    }
  };

  const anteriorMarca = async (kpiId = null) => {
    const nuevaMarcaIndex = (marcaActiva - 1 + marcas.length) % marcas.length;
    setMarcaActiva(nuevaMarcaIndex);
    setProductoActivo(0); // Reset producto al cambiar marca
    // Cargar referencias para la nueva marca
    if (marcas[nuevaMarcaIndex]) {
      await cargarReferencias(marcas[nuevaMarcaIndex].id, kpiId);
    }
  };

  const siguienteProducto = () => {
    if (todosLosProductos.length > 0) {
      setProductoActivo(prev => (prev + 1) % todosLosProductos.length);
    }
  };

  const anteriorProducto = () => {
    if (todosLosProductos.length > 0) {
      setProductoActivo(prev => (prev - 1 + todosLosProductos.length) % todosLosProductos.length);
    }
  };

  const setProductoActivoDirecto = (index) => {
    if (index >= 0 && index < todosLosProductos.length) {
      setProductoActivo(index);
    }
  };

  // Función para obtener productos (ahora no necesita filtrar porque vienen del API por marca)
  const obtenerProductosFiltrados = () => {
    return todosLosProductos; // Ya vienen filtrados por marca desde el API
  };

  // Función para recargar referencias de la marca actual (útil cuando cambia KPI)
  const recargarReferenciasActuales = async (kpiId = null) => {
    if (marcas.length > 0 && marcas[marcaActiva]) {
      await cargarReferencias(marcas[marcaActiva].id, kpiId);
    }
  };

  // Nueva función específica para cambio de KPI
  const cambiarKPI = async (kpiId) => {
    if (marcas.length > 0 && marcas[marcaActiva]) {
      await cargarReferencias(marcas[marcaActiva].id, kpiId);
    }
  };

  // Función para forzar recarga completa (marcas y referencias)
  const recargarTodo = async () => {
    await cargarMarcas();
  };

  // Cargar marcas al montar el componente
  useEffect(() => {
    cargarMarcas();
  }, []);

  // Resetear producto activo cuando cambien los productos
  useEffect(() => {
    if (todosLosProductos.length > 0) {
      setProductoActivo(0);
    }
  }, [todosLosProductos]);

  return {
    productos: obtenerProductosFiltrados(), // Referencias de la marca activa
    todosLosProductos, // Todos los productos (por si se necesitan)
    productosSeleccionados,
    marcas,
    marcaActiva,
    productoActivo,
    isLoading,
    error,
    agregarProducto,
    actualizarCantidad,
    actualizarPrecio,
    eliminarProducto,
    limpiarSeleccion,
    obtenerTotal,
    cargarProductos,
    cargarMarcas,
    cargarReferencias,
    recargarReferenciasActuales, // Nueva función para recargar referencias actuales
    recargarTodo, // Nueva función para recargar todo
    cambiarKPI, // Nueva función para cambio de KPI
    siguienteMarca,
    anteriorMarca,
    siguienteProducto,
    anteriorProducto,
    setProductoActivo: setProductoActivoDirecto
  };
};
