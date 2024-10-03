import React, { useState, useContext } from 'react';
import { AuthContext } from './AuthContext'; 
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import Sidebar from './Sidebar'; 
import { useLocation } from 'react-router-dom';
import './Home.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3000'
function Ventas() {
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [productosVendidos, setProductosVendidos] = useState([]);
  const location = useLocation();
  const { user } = useContext(AuthContext); 
  const [carrito, setCarrito] = useState(location.state?.carrito.map(producto => ({ ...producto, cantidad: undefined })) || []);

  const handleCantidadChange = (index, nuevaCantidad) => {
    const parsedCantidad = parseInt(nuevaCantidad, 10);
    
    if (isNaN(parsedCantidad) || parsedCantidad < 1 || parsedCantidad > carrito[index].stock) {
      setError('Cantidad no válida o mayor al stock disponible');
      return;
    }

    const nuevoCarrito = carrito.map((producto, i) => 
      i === index ? { ...producto, cantidad: parsedCantidad, total: parsedCantidad * parseFloat(producto.precio_venta || 0) } : producto
    );
    setCarrito(nuevoCarrito);
    setError(null); // Limpiar el mensaje de error si la cantidad es válida
  };

  const confirmarVenta = () => {
    setShowDialog(true); 
  };

  const cerrarDialog = () => {
    setShowDialog(false); 
  };

  const realizarVenta = async () => {
    const token = localStorage.getItem('token'); 

    if (carrito.length === 0) {
      setError('No hay productos en el carrito.');
      return;
    }

    // Verificar si todos los productos tienen cantidad válida
    if (carrito.some(producto => producto.cantidad === undefined || producto.cantidad <= 0)) {
      setError('Algunos productos no tienen una cantidad válida.');
      return;
    }

    try {
      const response = await fetch(`${URL}/api/ventas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productos: carrito.map(producto => ({
            productoId: producto.productoId, 
            cantidad: producto.cantidad
          }))
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Venta realizada exitosamente.');
        setError(null);
        setCarrito([]); 
        setProductosVendidos(data.productosVendidos || []);
        setShowReceiptDialog(true);
      } else {
        setError(data.error);
        setSuccessMessage(null);
      }
      cerrarDialog();
    } catch (error) {
      setError('Error al realizar la venta');
      setSuccessMessage(null);
      cerrarDialog();
    }
  };

  // Función para generar y descargar el recibo como PDF usando jsPDF
  const generarReciboPDF = () => {
    if (!productosVendidos || productosVendidos.length === 0) {
      setError('No hay productos vendidos para generar un recibo.');
      return;
    }
  
    const doc = new jsPDF();
  
    // Título del recibo
    doc.setFontSize(18);
    doc.text('Recibo de Venta', 14, 22);
  
    // Detalles adicionales como la fecha y el usuario
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Vendedor: ${user?.nombre || 'No especificado'}`, 14, 36);

    // Definir el encabezado de la tabla
    const encabezado = [['Producto', 'Marca', 'Cantidad', 'Precio Unitario', 'Total']];
  
    // Llenar los datos de los productos vendidos en el cuerpo de la tabla
    const cuerpoTabla = productosVendidos.map(producto => [
      producto.nombre,
      producto.marca,
      producto.cantidad,
      parseFloat(producto.precioUnitario).toFixed(2), // Formatear a 2 decimales
      parseFloat(producto.totalProducto).toFixed(2)  // Formatear a 2 decimales
    ]);
  
    // Insertar la tabla en el PDF
    doc.autoTable({
      head: encabezado,
      body: cuerpoTabla,
      startY: 50, // Coordenada Y donde comienza la tabla
      theme: 'striped', // Tema de la tabla
      headStyles: { fillColor: [41, 128, 185] }, // Color de fondo para el encabezado
      styles: { halign: 'center' }, // Centrar el texto en las celdas
    });
  
    // Guardar el PDF
    doc.save('recibo_venta.pdf');
  };

  return (
    <div className="home-container">
      <Sidebar />
      <main className="main-content">
        <h2>Ventas</h2>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirmarVenta(); 
          }}
          style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}
        >
          {carrito.length > 0 && (
           <TableContainer component={Paper}>
           <Table>
             <TableHead>
               <TableRow>
                 <TableCell>Producto</TableCell>
                 <TableCell>Marca</TableCell>
                 <TableCell>Tipo de Medida</TableCell>
                 <TableCell>Cantidad (Stock disponible)</TableCell>
                 <TableCell>Precio Unitario</TableCell>
                 <TableCell>Total</TableCell>
               </TableRow>
             </TableHead>
             <TableBody>
               {carrito.map((producto, index) => (
                 <TableRow key={index}>
                   <TableCell>{producto.nombre}</TableCell>
                   <TableCell>{producto.marca}</TableCell>
                   <TableCell>{producto.tipo_medida}</TableCell>
                   <TableCell>
                     <TextField
                       label={`Cantidad (Stock disponible: ${producto.stock})`}
                       variant="outlined"
                       value={producto.cantidad === undefined ? '' : producto.cantidad}
                       onChange={(e) => handleCantidadChange(index, e.target.value)}
                       inputProps={{ min: 1 }}
                       fullWidth
                       InputLabelProps={{
                         shrink: true,
                       }}
                       style={{
                         marginTop: '10px',
                       }}
                     />
                   </TableCell>
                   <TableCell>
                     {Number.isFinite(parseFloat(producto.precio_venta)) 
                       ? parseFloat(producto.precio_venta).toFixed(2) 
                       : '0.00'}
                   </TableCell>
                   <TableCell>
                     {(Number.isFinite(producto.cantidad) && Number.isFinite(parseFloat(producto.precio_venta))
                       ? (producto.cantidad * parseFloat(producto.precio_venta)).toFixed(2)
                       : '0.00')}
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </TableContainer>
          )}

          <Button variant="contained" color="primary" type="submit" disabled={carrito.length === 0}>
            Realizar Venta
          </Button>
        </form>

        <Dialog open={showDialog} onClose={cerrarDialog}>
          <DialogTitle>Confirmar Venta</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Está seguro de que desea realizar esta venta?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cerrarDialog} color="secondary">
              Cancelar
            </Button>
            <Button onClick={realizarVenta} color="primary">
              Aceptar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para preguntar si desea imprimir el recibo */}
        <Dialog open={showReceiptDialog} onClose={() => setShowReceiptDialog(false)}>
          <DialogTitle>Recibo</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Desea descargar o imprimir el recibo de la venta?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowReceiptDialog(false)} color="secondary">
              No
            </Button>
            <Button onClick={() => {
              generarReciboPDF();
              setShowReceiptDialog(false); // Cierra la ventana después de descargar
            }} color="primary">
              Sí, descargar
            </Button>
          </DialogActions>
        </Dialog>

      </main>
    </div>
  );
}

export default Ventas;
