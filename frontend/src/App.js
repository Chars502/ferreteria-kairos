import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext'; 
import Login from './Login';
import Home from './home';
import Ventas from './ventas';
import Usuarios from './usuarios';
import Inventario from './inventario';
import Reportes from './reportes';
import AgregarProducto from './AgregarProducto';
import PrivateRoute from './PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route path="/home" element={
            <PrivateRoute allowedRoles={['ADMIN', 'USER']}>
              <Home />
            </PrivateRoute>
          } />

          <Route path="/ventas" element={
            <PrivateRoute allowedRoles={['ADMIN', 'USER']}>
              <Ventas />
            </PrivateRoute>
          } />

          <Route path="/inventario" element={
            <PrivateRoute allowedRoles={['ADMIN', 'USER']}>
              <Inventario />
            </PrivateRoute>
          } />

          <Route path="/usuarios" element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <Usuarios />
            </PrivateRoute>
          } />

          <Route path="/reportes" element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <Reportes />
            </PrivateRoute>
          } />

          <Route path="/agregar-producto" element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AgregarProducto />
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
