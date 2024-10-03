import React, { useState, useEffect } from 'react';
import {
  Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Pagination
} from '@mui/material';
import Sidebar from './Sidebar'; // Importa el Sidebar
import './Home.css'; // Estilos generales
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'; // Icono para agregar al carrito
import { useNavigate, useLocation } from 'react-router-dom'; // Para navegar entre vistas
const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3000'
function Inventario() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]); // Estado para el carrito de compras
  const [searchTerm, setSearchTerm] = useState(''); // Estado para la búsqueda
  const [currentPage, setCurrentPage] = useState(1); // Estado para la página actual
  const itemsPerPage = 7; // Número de productos por página

  const navigate = useNavigate(); // Hook para redirigir
  const location = useLocation();

  useEffect(() => {
    cargarProductos(); // Cargar productos al montar el componente
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await fetch(`${URL}/api/productos`);
      if (response.ok) {
        const productos = await response.json();
        setProductos(productos); // Aquí debes asegurarte que se actualicen los productos correctamente
      } else {
        alert('No se pudieron cargar los productos');
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      alert('Error al cargar los productos');
    }
  };

  const agregarAlCarrito = (producto) => {
    const productoExistente = carrito.find(item => item.productoId === producto.id);
    if (productoExistente) {
      setCarrito(carrito.map(item =>
        item.productoId === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        productoId: producto.id,
        nombre: producto.nombre,
        marca: producto.marca,
        cantidad: 1, // Inicialmente se pone la cantidad en 1
        precio_venta: producto.precio_venta,
        stock: producto.cantidad, // Se pasa el stock disponible desde inventario
        tipo_medida: producto.tipo_medida
      }]);
    }
  };

  const irAVentas = () => {
    navigate('/ventas', { state: { carrito } });
  };

  const cambiarPagina = (evento, nuevaPagina) => {
    setCurrentPage(nuevaPagina); // Cambiar la página actual
  };

  // Filtrar los productos según el término de búsqueda
  const productosFiltrados = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.tipo_medida.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.cantidad.toString().includes(searchTerm.toLowerCase()) ||
    producto.precio_venta.toString().includes(searchTerm.toLowerCase()) ||
    producto.precio_compra.toString().includes(searchTerm.toLowerCase()) // Incluir precio de compra en la búsqueda
  );

  const totalPages = Math.ceil(productosFiltrados.length / itemsPerPage);
  const productosPaginados = productosFiltrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="home-container">
      <Sidebar />
      <main className="main-content">
        <div style={{ padding: 20 }}>
          <h2>Inventario</h2>
          
          {/* Campo de búsqueda */}
          <TextField
            label="Buscar en el inventario"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: 10, width: '100%' }}
          />

          {/* Tabla de productos */}
          <TableContainer component={Paper} style={{ marginTop: 20 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Marca</TableCell>
                  <TableCell>Tipo de Medida</TableCell>
                  <TableCell>Cantidad / Metros Cuadrados</TableCell>
                  <TableCell>Precio de compra</TableCell> {/* Nueva columna */}
                  <TableCell>Precio de venta</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productosPaginados.map((producto) => (
                  <TableRow key={producto.id} style={{ backgroundColor: producto.cantidad === 0 ? '#f8d7da' : 'transparent' }}>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>{producto.marca}</TableCell>
                    <TableCell>{producto.tipo_medida}</TableCell>
                    <TableCell>
                      {producto.cantidad === 0 ? (
                        <span style={{ color: 'red', fontWeight: 'bold' }}>Sin Stock</span>
                      ) : (
                        producto.cantidad
                      )}
                    </TableCell>
                    <TableCell>{producto.precio_compra}</TableCell> {/* Mostrar precio de compra */}
                    <TableCell>{producto.precio_venta}</TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => agregarAlCarrito(producto)}
                        disabled={producto.cantidad === 0}  // Desactivar si no hay stock
                      >
                        <ShoppingCartIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={cambiarPagina}
              color="primary"
            />
          </div>

          {/* Botón para ir a la vista de ventas */}
          <Button
            variant="contained"
            color="primary"
            onClick={irAVentas}
            disabled={carrito.length === 0}
            style={{ marginTop: 20 }}
          >
            Ir a Ventas ({carrito.length} productos)
          </Button>
        </div>
      </main>
    </div>
  );
}

export default Inventario;
