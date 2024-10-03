import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { AuthContext } from './AuthContext'; // Importar el contexto
import { IconButton, Menu, MenuItem, Button } from '@mui/material'; // Asegurarse de que Button esté importado
import './Home.css';

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); 
  const { user, logout } = useContext(AuthContext); // Obtenemos el usuario y la función logout desde el contexto
  const [anchorEl, setAnchorEl] = useState(null);

  const toggleSidebar = () => {
    setIsOpen(!isOpen); 
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      {/* Botón hamburguesa visible solo en pantallas pequeñas */}
      <button className="menu-btn" onClick={toggleSidebar}>
        <MenuIcon style={{ color: 'black', fontSize: '2rem' }} />
      </button>

      {/* Sidebar que se despliega o se oculta */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Ferretería</h2>
        </div>
        <ul className="sidebar-menu">
          <li>
            <NavLink exact="true" to="/home" activeClassName="active" onClick={toggleSidebar}>Inicio</NavLink>
          </li>
          <li>
            <NavLink to="/inventario" activeClassName="active" onClick={toggleSidebar}>Inventario</NavLink>
          </li>
          <li>
            <NavLink to="/ventas" activeClassName="active" onClick={toggleSidebar}>Ventas</NavLink>
          </li>

          {/* Mostrar estas rutas solo si el usuario es administrador */}
          {user?.rol === 'ADMIN' && (
            <>
              <li>
                <NavLink to="/usuarios" activeClassName="active" onClick={toggleSidebar}>Usuarios</NavLink>
              </li>
              <li>
                <NavLink to="/reportes" activeClassName="active" onClick={toggleSidebar}>Reportes</NavLink>
              </li>
              <li>
                <NavLink to="/agregar-producto" activeClassName="active" onClick={toggleSidebar}>Agregar Productos</NavLink>
              </li>
            </>
          )}
        </ul>

        {/* Icono de usuario con el nombre y opciones */}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <IconButton onClick={handleMenuClick}>
            <AccountCircleIcon style={{ fontSize: 40 }} />
          </IconButton>
          <span style={{ color: '#000000', fontWeight: 'bold', marginLeft: '10px' }}>{user?.nombre || 'Usuario'}</span> {/* Mostrar el nombre del usuario con color y estilo */}

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={logout}>Cerrar sesión</MenuItem> {/* Cambié a MenuItem para consistencia de menú */}
          </Menu>
        </div>
      </aside>
    </div>
  );
}

export default Sidebar;
