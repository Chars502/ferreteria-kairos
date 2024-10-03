import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3000';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Estado del usuario autenticado
  const navigate = useNavigate();

  // Cargar los datos del usuario desde localStorage cuando la app se inicializa
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (token && savedUser && savedUser !== "undefined" && savedUser !== "null") {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('Usuario cargado desde localStorage:', parsedUser); // Debug para verificar si se está cargando
        setUser(parsedUser); // Si hay un usuario guardado, lo cargamos en el estado
      } catch (error) {
        console.error('Error al parsear el usuario guardado:', error);
        localStorage.removeItem('user');  // Limpiar el localStorage en caso de error
      }
    }
  }, []);
  
  const login = async (email, password) => {
    try {
      const response = await fetch(`${URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
    
      const data = await response.json();
      console.log('Respuesta del servidor:', data);
    
      if (response.ok && data.user && data.token) {
        // Guarda el usuario y su rol correctamente
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        setUser(data.user); // Asegúrate de que estás guardando correctamente el usuario en el estado
        navigate('/home');
        return true;  // Login exitoso
      } else {
        console.error('Error en el login:', data.error);
        return false; // Login fallido
      }
    } catch (error) {
      console.error('Error en la autenticación:', error);
      return false; // Login fallido
    }
  };
  
  
  const logout = () => {
    // Limpiar el localStorage y el estado
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null); // Resetea el estado del usuario
    navigate('/'); // Redirige al login
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
