import React, { useState, useEffect } from 'react';
import { Button, TextField, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import Sidebar from './Sidebar'; // Importar el Sidebar
import './Home.css'; // Importar estilos generales
const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3000'
function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', correo: '', contrasena: '', rol: 'USER' });
  const [error, setError] = useState(''); // Añadir un estado para manejar errores

  // Función para cargar usuarios desde el backend
  const cargarUsuarios = async () => {
    const token = localStorage.getItem('token'); // Obtener el token del localStorage

    try {
      const response = await fetch(`${URL}/api/usuarios`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Enviar el token en el encabezado
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      } else {
        setError('No se pudieron cargar los usuarios.'); // Manejar el error en caso de fallo de la solicitud
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar los usuarios.'); // Manejar el error
    }
  };

  useEffect(() => {
    cargarUsuarios(); // Cargar usuarios cuando el componente se monte
  }, []);

  // Función para agregar un usuario
  const agregarUsuario = async () => {
    const { nombre, correo, contrasena, rol } = nuevoUsuario;
    const token = localStorage.getItem('token'); // Obtener el token del localStorage

    if (nombre && correo && contrasena && rol) {
      try {
        const response = await fetch('http://localhost:3000/api/usuarios', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`, // Enviar el token en el encabezado
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nuevoUsuario), // Enviar el nuevo usuario al backend
        });

        if (response.ok) {
          cargarUsuarios(); // Recargar la lista de usuarios después de agregar uno nuevo
          setNuevoUsuario({ nombre: '', correo: '', contrasena: '', rol: 'USER' });
        } else {
          setError('Error al agregar el usuario.');
        }
      } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        setError('Error al agregar el usuario.');
      }
    } else {
      setError('Por favor, rellene todos los campos.');
    }
  };

  return (
    <div className="home-container">
      <Sidebar /> {/* Renderizar el Sidebar */}
      <main className="main-content"> {/* Ajustar el contenido principal */}
        <div style={{ padding: 20 }}>
          <h2>Usuarios</h2>

          {error && <p style={{ color: 'red' }}>{error}</p>} {/* Mostrar el error si existe */}

          <form onSubmit={(e) => { e.preventDefault(); agregarUsuario(); }} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <TextField
              label="Nombre"
              variant="outlined"
              value={nuevoUsuario.nombre}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
              fullWidth
            />
            <TextField
              label="Correo"
              type="email"
              variant="outlined"
              value={nuevoUsuario.correo}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })}
              fullWidth
            />
            <TextField
              label="Contraseña"
              type="password"
              variant="outlined"
              value={nuevoUsuario.contrasena}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, contrasena: e.target.value })}
              fullWidth
            />
            <Select
              label="Rol"
              value={nuevoUsuario.rol}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
              variant="outlined"
              style={{ width: '150px' }}
            >
              <MenuItem value="USER">Usuario</MenuItem>
              <MenuItem value="ADMIN">Administrador</MenuItem>
            </Select>
            <Button variant="contained" color="primary" type="submit">Agregar Usuario</Button>
          </form>

          {/* Tabla de usuarios */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Correo</TableCell>
                  <TableCell>Rol</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map((usuario, index) => (
                  <TableRow key={index}>
                    <TableCell>{usuario.nombre}</TableCell>
                    <TableCell>{usuario.correo}</TableCell>
                    <TableCell>{usuario.rol}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </main>
    </div>
  );
}

export default Usuarios;
