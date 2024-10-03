import React, { useState } from 'react';
import { Button, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import Sidebar from './Sidebar'; // Importa el Sidebar
import './Home.css'; // Estilos generales

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3000'

function AgregarProducto() {
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    marca: '',
    tipo_medida: 'cantidad',
    cantidad: '',
    precio_compra: '',
    precio_venta: ''
  });

  const agregarProducto = async () => {
    const { nombre, marca, tipo_medida, cantidad, precio_compra, precio_venta } = nuevoProducto;
    const token = localStorage.getItem('token'); // Asegúrate de enviar el token
  
    if (nombre && marca && cantidad > 0 && precio_compra > 0 && precio_venta > 0) {
      try {
        const response = await fetch(`${URL}/api/productos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`, // Enviar el token
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nuevoProducto),
        });
  
        if (response.ok) {
          const data = await response.json();
          // Mostrar diferentes mensajes dependiendo de si se agregó o actualizó el producto
          if (data.message.includes('actualizado')) {
            alert('Stock del producto actualizado correctamente.');
          } else {
            alert('Producto agregado exitosamente.');
          }

          // Reiniciar el formulario
          setNuevoProducto({
            nombre: '',
            marca: '',
            tipo_medida: 'cantidad',
            cantidad: '',
            precio_compra: '',
            precio_venta: ''
          });
        } else {
          const errorData = await response.json();
          alert('Error al agregar el producto: ' + errorData.error);
        }
      } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        alert('Error al agregar el producto.');
      }
    } else {
      alert('Por favor, rellene todos los campos correctamente.');
    }
  };
  
  return (
    <div className="home-container">
      <Sidebar />
      <main className="main-content">
        <div style={{ padding: 20 }}>
          <h2>Agregar Producto</h2>
          <form onSubmit={(e) => { e.preventDefault(); agregarProducto(); }}>
            <TextField
              label="Nombre del producto"
              variant="outlined"
              value={nuevoProducto.nombre}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
              style={{ marginRight: 10, margin: 10 }}
            />
            <TextField
              label="Marca"
              variant="outlined"
              value={nuevoProducto.marca}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, marca: e.target.value })}
              style={{ marginRight: 10, margin: 10 }}
            />
            <FormControl style={{ marginRight: 10, margin: 10 }}>
              <InputLabel>Tipo de Medida</InputLabel>
              <Select
                value={nuevoProducto.tipo_medida}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, tipo_medida: e.target.value })}
              >
                <MenuItem value="cantidad">Cantidad</MenuItem>
                <MenuItem value="metros_cuadrados">Metros Cuadrados</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={nuevoProducto.tipo_medida === 'cantidad' ? "Cantidad" : "Metros Cuadrados"}
              variant="outlined"
              value={nuevoProducto.cantidad}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: e.target.value })}
              style={{ marginRight: 10, margin: 10 }}
              inputProps={{ inputMode: 'decimal', pattern: '[0-9.]*' }}
            />
            <TextField
              label="Precio de costo"
              variant="outlined"
              value={nuevoProducto.precio_compra}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio_compra: e.target.value })}
              style={{ marginRight: 10, margin: 10 }}
              inputProps={{ inputMode: 'decimal', pattern: '[0-9.]*' }}
            />
            <TextField
              label="Precio de venta"
              variant="outlined"
              value={nuevoProducto.precio_venta}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio_venta: e.target.value })}
              style={{ marginRight: 10, margin: 10 }}
              inputProps={{ inputMode: 'decimal', pattern: '[0-9.]*' }}
            />
            <Button variant="contained" color="primary" type="submit">Agregar Producto</Button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AgregarProducto;
