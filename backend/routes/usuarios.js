// routes/usuarios.js
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db'); // Asegúrate de que tu configuración de conexión a la base de datos esté aquí

const router = express.Router();

router.post('/crear', async (req, res) => {
  const { username, email, telefono, password, rol, jefe_id } = req.body;

  if (!username || !email || !telefono || !password || !rol || !jefe_id) {
    return res.status(400).json({ message: 'Faltan campos requeridos.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (username, email, telefono, password, rol, jefe_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, rol`,
      [username, email, telefono, hashedPassword, rol, jefe_id]
    );

    res.status(201).json({
      message: `Usuario ${rol} creado exitosamente.`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear el usuario.' });
  }
});

module.exports = router;
