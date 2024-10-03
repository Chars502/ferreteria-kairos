import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Paper, Typography, Container, Box } from '@mui/material';
import { AuthContext } from './AuthContext';
import './Login.css';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3000';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();
    setError(''); // Limpiar el error antes de intentar el login

    try {
      const credentials = { email, password };
      console.log('Enviando credenciales:', credentials);

      const success = await login(email, password); // Usa la función login del contexto

      if (!success) {
        // Si el login falla, muestra el mensaje de error
        setError('Correo o contraseña incorrectos. Intente de nuevo.');
      }

    } catch (error) {
      console.error('Error durante el login:', error);
      setError('Ocurrió un error inesperado. Intente de nuevo.');
    }
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} style={{ padding: '20px', marginTop: '50px' }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography component="h1" variant="h5">
            Iniciar Sesión
          </Typography>
          <form onSubmit={handleLogin} style={{ width: '100%', marginTop: '20px' }}>
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <Typography variant="body2" style={{ color: 'red', marginTop: '10px' }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              style={{ marginTop: '20px', marginBottom: '20px' }}
            >
              Iniciar Sesión
            </Button>
          </form>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login;
