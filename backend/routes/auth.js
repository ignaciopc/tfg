const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db'); // Conexión a PostgreSQL
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const SECRET_KEY = '1234567890'; // Reemplaza esto por process.env.SECRET_KEY en producción

// ---------------- REGISTRO ----------------
router.post('/register', async (req, res) => {
  const { username, email, telefono, password } = req.body;

  try {
    const userExists = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

// ---------------- LOGIN ----------------
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

// ---------------- CREAR FINCA ----------------
router.post('/fincas/crear', async (req, res) => {
  const { nombre, ubicacion, tamano, tipoCultivo } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    if (!ubicacion || !ubicacion.type || ubicacion.type !== 'Polygon') {
      return res.status(400).json({ message: 'Ubicación inválida.' });
    }

    const result = await pool.query(
      `INSERT INTO fincas (nombre, ubicacion, tamano, tipo_cultivo, usuario_id)
       VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326), $3, $4, $5) RETURNING *`,
      [nombre, JSON.stringify(ubicacion), tamano, tipoCultivo, userId]
    );

    res.status(201).json({ message: 'Finca agregada con éxito.', finca: result.rows[0] });
  } catch (err) {
    console.error('Error al crear finca:', err);
    res.status(500).json({ message: 'Error interno al crear finca.' });
  }
});

// ---------------- LISTAR FINCAS ----------------
router.get('/fincas/lista', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    const result = await pool.query(
      `SELECT id, nombre, tamano, tipo_cultivo, usuario_id, fecha_creacion,
              ST_AsGeoJSON(ST_Centroid(ubicacion)) AS centroide_geojson
       FROM fincas
       WHERE usuario_id = $1`,
      [userId]
    );

    const fincasConMunicipio = await Promise.all(result.rows.map(async finca => {
      const centroide = JSON.parse(finca.centroide_geojson);
      const lat = centroide.coordinates[1];
      const lon = centroide.coordinates[0];

      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: {
            lat,
            lon,
            format: 'json',
            addressdetails: 1
          }
        });

        const address = response.data.address;
        const municipio = address.city || address.town || address.village || address.municipality || 'Desconocido';

        return { ...finca, municipio };
      } catch (error) {
        return { ...finca, municipio: 'Desconocido' };
      }
    }));

    res.status(200).json({ fincas: fincasConMunicipio });
  } catch (err) {
    console.error('Error al obtener fincas:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});

// ---------------- ELIMINAR FINCA ----------------
router.delete('/fincas/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    const fincaId = req.params.id;

    const result = await pool.query(
      'SELECT * FROM fincas WHERE id = $1 AND usuario_id = $2',
      [fincaId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Finca no encontrada o no autorizada.' });
    }

    await pool.query('DELETE FROM fincas WHERE id = $1', [fincaId]);
    res.status(200).json({ message: 'Finca eliminada correctamente.' });
  } catch (err) {
    console.error('Error al eliminar finca:', err);
    res.status(500).json({ message: 'Error al eliminar finca.' });
  }
});

module.exports = router;
