const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; 

// Conexión a PostgreSQL usando DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET no está definido.');
  process.exit(1); // Detener si falta
}

// Middleware para autenticar tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Rutas de autenticación ---
app.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).send('Faltan datos.');
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, proveedor_identidad_id)
       VALUES ($1, $2, $3, (SELECT id FROM proveedores_identidad WHERE nombre = $4))
       RETURNING id, nombre, email`,
      [nombre, email, hashedPassword, 'email_password']
    );
    res.status(201).json({ message: 'Usuario registrado', user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al registrar usuario (¿email duplicado?).');
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send('Faltan datos.');

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !user.password_hash) return res.status(401).send('Credenciales inválidas.');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).send('Credenciales inválidas.');

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error del servidor.');
  }
});

app.post('/login/google', async (req, res) => {
  const { email, name } = req.body;
  try {
    let result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    let user = result.rows[0];
    if (!user) {
      result = await pool.query(
        `INSERT INTO usuarios (nombre, email, proveedor_identidad_id)
         VALUES ($1, $2, (SELECT id FROM proveedores_identidad WHERE nombre = $3))
         RETURNING id, nombre, email`,
        [name, email, 'google']
      );
      user = result.rows[0];
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error del servidor.');
  }
});

app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const rolesQuery = await pool.query(
      `SELECT r.nombre
       FROM usuarios_roles ur
       JOIN roles r ON ur.rol_id = r.id
       WHERE ur.usuario_id = $1`,
      [req.user.userId]
    );
    const roles = rolesQuery.rows.map(row => row.nombre);

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

    const userQuery = await pool.query('SELECT id, nombre, email FROM usuarios WHERE id = $1', [req.user.userId]);
    const user = userQuery.rows[0];
    if (!user) return res.status(404).send('Usuario no encontrado.');

    res.json({ user, roles, permissions });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error del servidor.');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
