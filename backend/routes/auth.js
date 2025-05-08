const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db'); // Conexión a PostgreSQL
const jwt = require('jsonwebtoken');
require('dotenv').config(); // <- Esto carga las variables del .env

const SECRET_KEY = '1234567890'; // <- Usa la clave secreta de tu archivo .env


// Ruta de registro
router.post('/register', async (req, res) => {
  const { username, email, telefono, password } = req.body;

  try {
    // Verificar si el correo ya está registrado
    const userExists = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado.' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    await pool.query(
      `INSERT INTO usuarios (nombre, correo, telefono, contraseña)
         VALUES ($1, $2, $3, $4)`,
      [username, email, telefono, hashedPassword]
    );


    res.status(201).json({ message: 'Usuario registrado con éxito.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});

// Ruta de inicio de sesión
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    const isValidPassword = await bcrypt.compare(password, user.rows[0].contraseña);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].correo },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Inicio de sesión exitoso', token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Ruta para agregar una finca
router.post('/fincas/crear', async (req, res) => {
  const { nombre, ubicacion, tamano, tipoCultivo } = req.body;
  const token = req.headers.authorization?.split(" ")[1];  // Obtener el token del encabezado de autorización

  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token de autenticación.' });
  }

  try {
    // Verificar si el token es válido
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id; // Extraer el ID del usuario del token

    // Validar que la ubicación esté correctamente formateada como GeoJSON
    if (!ubicacion || !ubicacion.type || ubicacion.type !== 'Polygon') {
      return res.status(400).json({ message: 'La ubicación debe ser un objeto GeoJSON válido de tipo Polygon.' });
    }

    // Insertar la finca en la base de datos
    const result = await pool.query(
      `INSERT INTO fincas (nombre, ubicacion, tamano, tipo_cultivo, usuario_id)
       VALUES ($1, ST_GeomFromGeoJSON($2), $3, $4, $5) RETURNING *`,
      [nombre, JSON.stringify(ubicacion), tamano, tipoCultivo, userId]
    );

    const nuevaFinca = result.rows[0];

    res.status(201).json({ message: 'Finca agregada con éxito.', finca: nuevaFinca });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});


// Exportar el router
module.exports = router;
