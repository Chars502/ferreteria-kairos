import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  console.log('Usuario en PrivateRoute:', user);

  if (!user) {
    return <Navigate to="/" />;
  }

  // Verificar si el rol del usuario está permitido para acceder a la ruta
  if (!allowedRoles.includes(user.rol)) {
    return <Navigate to="/home" />; // Redirigir a home si no tiene el rol adecuado
  }

  return children;
};

export default PrivateRoute;
