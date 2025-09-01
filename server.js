const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; 

// Configuración de la base de datos (asegúrate de que los valores sean correctos)
const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

// Clave secreta para JWT (debe ser una variable de entorno en producción)
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware de autenticación para proteger rutas
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // Si no hay token, acceso no autorizado

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Token no válido o expirado
    req.user = user;
    next();
  });
};

// --------------------------------------------------------------------------
// RUTAS DE AUTENTICACIÓN
// --------------------------------------------------------------------------

// Ruta de registro de usuario con email y contraseña
app.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).send('Por favor, ingresa nombre, email y contraseña.');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, proveedor_identidad_id) VALUES ($1, $2, $3, (SELECT id FROM proveedores_identidad WHERE nombre = $4)) RETURNING id, nombre, email',
      [nombre, email, hashedPassword, 'email_password']
    );
    res.status(201).json({ message: 'Usuario registrado exitosamente', user: result.rows[0] });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).send('Error al registrar usuario. El email podría ya estar en uso.');
  }
});

// Ruta de login con email y contraseña
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Por favor, ingresa email y contraseña.');
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).send('Credenciales inválidas.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).send('Credenciales inválidas.');
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email } });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).send('Error del servidor.');
  }
});

// Ruta de login con Google SSO
app.post('/login/google', async (req, res) => {
  const { email, name } = req.body;
  try {
    // Buscar si el usuario ya existe
    let result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    let user = result.rows[0];

    // Si el usuario no existe, crearlo
    if (!user) {
      result = await pool.query(
        'INSERT INTO usuarios (nombre, email, proveedor_identidad_id) VALUES ($1, $2, (SELECT id FROM proveedores_identidad WHERE nombre = $3)) RETURNING id, nombre, email',
        [name, email, 'google']
      );
      user = result.rows[0];
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email } });
  } catch (error) {
    console.error('Error en login de Google:', error);
    res.status(500).send('Error del servidor.');
  }
});

// --------------------------------------------------------------------------
// RUTAS PROTEGIDAS Y GESTIÓN DE PERMISOS
// --------------------------------------------------------------------------

// Ruta para obtener el perfil del usuario y sus permisos
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    // Obtener los roles del usuario
    const rolesQuery = await pool.query(
      `SELECT r.nombre
       FROM usuarios_roles ur
       JOIN roles r ON ur.rol_id = r.id
       WHERE ur.usuario_id = $1`,
      [req.user.userId]
    );
    const roles = rolesQuery.rows.map(row => row.nombre);

    // Obtener los permisos del usuario para la aplicación 'intranet'
    const permissionsQuery = await pool.query(
      `SELECT DISTINCT p.nombre
       FROM usuarios u
       JOIN usuarios_roles ur ON u.id = ur.usuario_id
       JOIN roles r ON ur.rol_id = r.id
       JOIN permisos p ON r.id = p.rol_id
       JOIN aplicaciones a ON p.aplicacion_id = a.id
       WHERE u.id = $1 AND a.nombre = $2`,
      [req.user.userId, 'intranet']
    );
    const permissions = permissionsQuery.rows.map(row => row.nombre);

    // Obtener información básica del usuario
    const userQuery = await pool.query('SELECT id, nombre, email FROM usuarios WHERE id = $1', [req.user.userId]);
    const user = userQuery.rows[0];

    if (!user) {
      return res.status(404).send('Usuario no encontrado.');
    }

    res.json({
      user,
      roles,
      permissions
    });
  } catch (error) {
    console.error('Error al obtener el perfil del usuario:', error);
    res.status(500).send('Error del servidor.');
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
