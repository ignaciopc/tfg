const express = require('express');
const pool = require('../db');
const router = express.Router();

// Ruta para eliminar usuario por id
router.delete('/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [userId]);
    res.status(200).json({ message: 'Usuario eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error eliminando usuario' });
  }
});

// Ruta para obtener usuarios subordinados (los que tienen jefe_id igual al id del usuario actual)
router.get('/subordinados', async (req, res) => {
  // Aquí deberías obtener el id del usuario actual, por ejemplo del token:
  const userId = req.userId; // suponiendo que tienes middleware para extraerlo
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE jefe_id = $1', [userId]);
    res.status(200).json({ subordinados: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error obteniendo subordinados' });
  }
});

// Ruta para crear usuario (ya la tienes, solo cambia para que coincida con los campos correctos)
router.post('/crear', async (req, res) => {
  const { nombre, correo, telefono, contraseña, rol, jefe_id } = req.body;

  if (!nombre || !correo || !contraseña || !rol) {
    return res.status(400).json({ message: 'Faltan campos requeridos.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, telefono, contraseña, rol, jefe_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nombre, correo, rol`,
      [nombre, correo, telefono, hashedPassword, rol, jefe_id]
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
