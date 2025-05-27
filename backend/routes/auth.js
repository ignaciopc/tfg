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
  console.log('Datos recibidos en /fincas/crear:', req.body);
  const { nombre, ubicacion, tamano, tipoCultivo } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token de autenticación.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    if (!ubicacion || !ubicacion.type || ubicacion.type !== 'Polygon') {
      return res.status(400).json({ message: 'La ubicación debe ser un objeto GeoJSON válido de tipo Polygon.' });
    }

    const result = await pool.query(
      `INSERT INTO fincas (nombre, ubicacion, tamano, tipo_cultivo, usuario_id)
       VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326), $3, $4, $5) RETURNING *`,
      [nombre, JSON.stringify(ubicacion), tamano, tipoCultivo, userId]
    );

    res.status(201).json({ message: 'Finca agregada con éxito.', finca: result.rows[0] });

  } catch (err) {
    console.log('📥 Datos recibidos para crear finca:');
    console.log('Nombre:', nombre);
    console.log('Ubicación:', JSON.stringify(ubicacion, null, 2));
    console.log('Tamaño:', tamano);
    console.log('Tipo Cultivo:', tipoCultivo);

    console.error('❌ Error al crear finca:', err);
    console.error(err.stack);

    res.status(500).json({
      message: 'Error interno al crear finca.',
      error: err.message,
      stack: err.stack
    });
  }

});

// Ruta para listar fincas del usuario autenticado
const axios = require('axios');

router.get('/fincas/lista', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Token del header

  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó token de autenticación.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    // 1. Traer fincas y su centroide en GeoJSON
    const result = await pool.query(
      `SELECT id, nombre, tamano, tipo_cultivo, usuario_id, fecha_creacion,
              ST_AsGeoJSON(ST_Centroid(ubicacion)) AS centroide_geojson
       FROM fincas
       WHERE usuario_id = $1`,
      [userId]
    );

    // 2. Por cada finca, hacemos geocodificación inversa para obtener municipio
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
        // Intentamos obtener municipio, o localidad, pueblo o ciudad
        const municipio = address.city || address.town || address.village || address.municipality || 'Desconocido';

        return {
          ...finca,
          municipio
        };

      } catch (error) {
        // En caso de error en la API, devolvemos 'Desconocido'
        return {
          ...finca,
          municipio: 'Desconocido'
        };
      }
    }));

    res.status(200).json({ fincas: fincasConMunicipio });

  } catch (err) {
    console.error('Error al obtener fincas:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});




// Exportar el router
module.exports = router;
