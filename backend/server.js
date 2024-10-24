const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const app = express();
require('dotenv').config(); // Asegúrate de cargar las variables de entorno
// Coloca las siguientes líneas para verificar si las variables de entorno se cargan correctamente:
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
// Configuración de middlewares
app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY || 'your_jwt_secret_key'; // Clave secreta para JWT

// Configuración de la conexión a la base de datos usando un pool de conexiones
let db;

(async function initializeDB() {
  try {
    db = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: {
        ca: fs.readFileSync(__dirname + '/certs/ca.pem'), 
        rejectUnauthorized: false // Esto permite aceptar certificados autofirmados
      },
    });
    console.log('Conectado a la base de datos de Aiven');
  } catch (err) {
    console.error('Error conectando a la base de datos de Aiven:', err);
  }
})();



// Middleware para verificar el token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token no válido' });
    req.user = user;
    next();
  });
}

// Ruta para obtener todos los usuarios (solo accesible para admin)
app.get('/api/usuarios', authenticateToken, async (req, res) => {
  if (req.user.rol !== 'ADMIN') return res.status(403).json({ message: 'Acceso denegado' });

  try {
    const [usuarios] = await db.query('SELECT id, nombre, correo, rol FROM usuarios');
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Ruta para agregar un nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  const { nombre, correo, contrasena, rol } = req.body;

  if (!nombre || !correo || !contrasena || !rol) {
    return res.status(400).json({ error: 'Por favor, rellene todos los campos.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(contrasena, 10); // Encriptar la contraseña
    await db.query(
      'INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)',
      [nombre, correo, hashedPassword, rol]
    );
    res.status(201).json({ message: 'Usuario agregado correctamente' });
  } catch (error) {
    console.error('Error al agregar usuario:', error);
    res.status(500).json({ error: 'Error al agregar usuario' });
  }
});

// Ruta para el login de usuarios
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [email]);

    const user = rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const validPassword = await bcrypt.compare(password, user.contrasena);

    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: user.id, rol: user.rol }, SECRET_KEY, { expiresIn: '1h' });

    // Imprimir los datos que se están enviando al frontend
    console.log('Usuario autenticado:', user);
    console.log('Rol del usuario:', user.rol);
    console.log('Token generado:', token);

    return res.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol  // Verifica que se esté enviando el rol correcto aquí
      },
      token: token
    });

  } catch (error) {
    console.error('Error en el login:', error);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});









// Mantén esta versión para que se use la lógica correcta
app.post('/api/productos', authenticateToken, async (req, res) => {
  const { nombre, marca, cantidad, tipo_medida, precio_compra, precio_venta } = req.body;

  // Verificar si el usuario es admin
  if (req.user.rol !== 'ADMIN') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  // Validación de los datos
  if (!nombre || !marca || !tipo_medida || cantidad <= 0 || precio_compra <= 0 || precio_venta <= 0) {
    return res.status(400).json({ error: 'Datos inválidos. Asegúrate de que todos los campos tengan valores positivos.' });
  }

  try {
    // Comprobar si el producto ya existe en la base de datos por nombre y marca
    const [productoExistente] = await db.query('SELECT * FROM productos WHERE nombre = ? AND marca = ?', [nombre, marca]);

    if (productoExistente.length > 0) {
      // Si el producto ya existe, actualizamos el stock sumando la nueva cantidad
      const nuevoStock = productoExistente[0].cantidad + parseInt(cantidad);

      await db.query(
        'UPDATE productos SET cantidad = ?, tipo_medida = ?, precio_compra = ?, precio_venta = ? WHERE id = ?',
        [nuevoStock, tipo_medida, precio_compra, precio_venta, productoExistente[0].id]
      );

      return res.status(200).json({ message: 'Producto actualizado correctamente.' });
    } else {
      // Si no existe, lo agregamos como un nuevo producto
      const query = 'INSERT INTO productos (nombre, marca, cantidad, tipo_medida, precio_compra, precio_venta) VALUES (?, ?, ?, ?, ?, ?)';
      const [result] = await db.query(query, [nombre, marca, cantidad, tipo_medida, precio_compra, precio_venta]);

      return res.status(201).json({ message: 'Producto agregado correctamente', id: result.insertId });
    }
  } catch (error) {
    console.error('Error al agregar o actualizar producto:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});




// Endpoint para registrar la venta con múltiples productos
app.post('/api/ventas', authenticateToken, async (req, res) => {
  const { productos } = req.body;
  const usuario_id = req.user.id; // Obtener el usuario desde el token

  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: 'Debe enviar al menos un producto en la venta.' });
  }

  const connection = await db.getConnection(); // Obtener conexión para manejar transacciones

  try {
    await connection.beginTransaction(); // Iniciar la transacción

    let totalVenta = 0;
    const ventaDetalles = [];

    for (const producto of productos) {
      const { productoId, cantidad } = producto;

      if (!productoId || !cantidad || cantidad <= 0) {
        throw new Error(`Datos inválidos para el producto ID ${productoId}`);
      }

      const [productoData] = await connection.query('SELECT nombre, marca, precio_venta, cantidad FROM productos WHERE id = ?', [productoId]);

      if (productoData.length === 0) {
        throw new Error(`Producto con ID ${productoId} no encontrado`);
      }

      const precioUnitario = productoData[0].precio_venta;
      const stockActual = productoData[0].cantidad;

      if (cantidad > stockActual) {
        throw new Error(`No hay suficiente stock disponible para el producto ID ${productoId}`);
      }

      const totalProducto = precioUnitario * cantidad;
      totalVenta += totalProducto;

      ventaDetalles.push({
        nombre: productoData[0].nombre,
        marca: productoData[0].marca,
        productoId,
        cantidad,
        precioUnitario,
        totalProducto
      });
    }

    const [venta] = await connection.query(
      'INSERT INTO ventas (usuario_id, fecha, total) VALUES (?, NOW(), ?)', 
      [usuario_id, totalVenta]
    );

    const ventaId = venta.insertId;

    for (const detalle of ventaDetalles) {
      await connection.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, total, fecha) VALUES (?, ?, ?, ?, ?, NOW())',
        [ventaId, detalle.productoId, detalle.cantidad, detalle.precioUnitario, detalle.totalProducto]
      );

      await connection.query(
        'UPDATE productos SET cantidad = cantidad - ? WHERE id = ?',
        [detalle.cantidad, detalle.productoId]
      );
    }

    await connection.commit();

    // Enviar los detalles de la venta al frontend
    res.status(200).json({ 
      message: 'Venta registrada correctamente y stock actualizado', 
      ventaId, 
      productosVendidos: ventaDetalles  // Enviar los detalles de los productos vendidos
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al registrar la venta y actualizar el stock:', error);
    res.status(500).json({ error: 'Error al registrar la venta o actualizar el stock' });
  } finally {
    connection.release();
  }
});






// Endpoint para listar productos
app.get('/api/productos', async (req, res) => {
  try {
    const [productos] = await db.query('SELECT * FROM productos');
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});




// Endpoint para obtener ventas por rango de fechas
app.get('/api/ventas', async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  let query = `
    SELECT dv.*, 
           p.nombre AS producto, 
           p.marca, 
           p.tipo_medida, 
           p.precio_compra,  
           p.precio_venta AS precio_unitario, 
           v.fecha,  -- Asegúrate de que el campo fecha esté aquí
           dv.total 
    FROM detalle_ventas dv
    JOIN productos p ON dv.producto_id = p.id
    JOIN ventas v ON dv.venta_id = v.id
    
  `;

  const queryParams = [];
  if (fechaInicio && fechaFin) {
    query += ' WHERE v.fecha BETWEEN ? AND ?';
    queryParams.push(fechaInicio, fechaFin);
  }

  try {
    const [rows] = await db.query(query, queryParams);
    console.log('Ventas obtenidas con fecha:', rows); // Revisa si la fecha aparece aquí
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});









// Iniciar el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
