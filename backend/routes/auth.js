const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db'); // conexión a PostgreSQL

router.post('/api/register', async (req, res) => {
  const { username, email,telefono, password } = req.body;

  try {
    // Verifica si el usuario ya existe
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

module.exports = router;
