const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db'); // Conexión a PostgreSQL
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { createCanvas } = require('canvas');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

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
      { expiresIn: '7d' }
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

// ---------------- LISTAR FINCAS CON GEOMETRÍA Y DATOS ECONÓMICOS ----------------
router.get('/fincas/lista', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    // Obtener rol y jefe_id del usuario para decidir qué fincas mostrar
    const userResult = await pool.query(
      'SELECT rol, jefe_id FROM usuarios WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const { rol, jefe_id } = userResult.rows[0];
    const ownerId = rol === 'trabajador' ? jefe_id : userId;

    // Obtener fincas según el ownerId calculado
    const result = await pool.query(
      `SELECT
         id,
         nombre,
         tamano,
         tipo_cultivo,
         usuario_id,
         fecha_creacion,
         objetivo_ingresos,
         dinero_gastado,
         dinero_ganado,
         ST_AsGeoJSON(ST_Centroid(ubicacion)) AS centroide_geojson,
         ST_AsGeoJSON(ubicacion) AS ubicacion_geojson
       FROM fincas
       WHERE usuario_id = $1`,
      [ownerId]
    );

    const fincas = await Promise.all(result.rows.map(async finca => {
      const centroide = JSON.parse(finca.centroide_geojson);
      const [lon, lat] = centroide.coordinates;

      const restante = Math.max(
        finca.objetivo_ingresos - (finca.dinero_gastado + finca.dinero_ganado),
        0
      );

      let municipio = 'Desconocido';
      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: { lat, lon, format: 'json', addressdetails: 1 }
        });
        const addr = response.data.address;
        municipio = addr.city || addr.town || addr.village || addr.municipality || municipio;
      } catch (e) {
        // dejamos municipio como 'Desconocido'
      }

      return {
        id: finca.id,
        nombre: finca.nombre,
        tamano: finca.tamano,
        tipo_cultivo: finca.tipo_cultivo,
        usuario_id: finca.usuario_id,
        fecha_creacion: finca.fecha_creacion,
        municipio,
        objetivo_ingresos: finca.objetivo_ingresos,
        dinero_gastado: finca.dinero_gastado,
        dinero_ganado: finca.dinero_ganado,
        restante,
        centroide_geojson: finca.centroide_geojson,
        ubicacion_geojson: finca.ubicacion_geojson
      };
    }));

    res.status(200).json({ fincas });
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

    // Obtener rol y jefe_id del usuario
    const userResult = await pool.query('SELECT rol, jefe_id FROM usuarios WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const { rol, jefe_id } = userResult.rows[0];

    // Solo si es jefe se permite eliminar
    if (rol === 'trabajador') {
      return res.status(403).json({ message: 'No tienes permisos para eliminar esta finca.' });
    }

    // Verificar que la finca pertenezca al usuario o a su jefe (por seguridad)
    const fincaResult = await pool.query('SELECT usuario_id FROM fincas WHERE id = $1', [fincaId]);
    if (fincaResult.rows.length === 0) return res.status(404).json({ message: 'Finca no encontrada.' });

    const fincaUsuarioId = fincaResult.rows[0].usuario_id;
    if (fincaUsuarioId !== userId) {
      return res.status(403).json({ message: 'No puedes eliminar fincas que no te pertenecen.' });
    }

    // Borrar finca
    await pool.query('DELETE FROM fincas WHERE id = $1', [fincaId]);
    res.status(200).json({ message: 'Finca eliminada correctamente.' });

  } catch (err) {
    console.error('Error al eliminar finca:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});

// Ejemplo básico en Express para /api/usuarios/me
router.get('/usuarios/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    const userResult = await pool.query(
      'SELECT id, nombre, correo, telefono, rol FROM usuarios WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });

    const user = userResult.rows[0];
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});


// ---------------- ACTUALIZAR DATOS ECONÓMICOS DE UNA FINCA ----------------
router.put('/fincas/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' })

  try {
    const decoded = jwt.verify(token, SECRET_KEY)
    const userId = decoded.id
    const fincaId = req.params.id
    const { objetivo_ingresos, dinero_gastado, dinero_ganado, trabajadores } = req.body

    const result = await pool.query(
      `UPDATE fincas
       SET objetivo_ingresos = $1,
           dinero_gastado = $2,
           dinero_ganado = $3,
           trabajadores = $4
       WHERE id = $5 AND usuario_id = $6
       RETURNING *`,
      [objetivo_ingresos, dinero_gastado, dinero_ganado, trabajadores, fincaId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Finca no encontrada o no autorizada.' })
    }

    res.status(200).json({ message: 'Finca actualizada con éxito.', finca: result.rows[0] })
  } catch (err) {
    console.error('Error al actualizar finca:', err)
    res.status(500).json({ message: 'Error al actualizar finca.' })
  }
})

// ---------------- OBTENER TRABAJADORES DE UNA FINCA ----------------
router.get('/fincas/:id/trabajadores', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    const fincaId = req.params.id;

    // Validar acceso a la finca
    const finca = await pool.query('SELECT id FROM fincas WHERE id = $1 AND usuario_id = $2', [fincaId, userId]);
    if (finca.rows.length === 0) {
      return res.status(403).json({ message: 'Acceso no autorizado.' });
    }

    const result = await pool.query('SELECT id, nombre, sueldo FROM trabajadores WHERE finca_id = $1', [fincaId]);
    res.status(200).json({ trabajadores: result.rows });
  } catch (err) {
    console.error('Error al obtener trabajadores:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});

// ---------------- GUARDAR (REEMPLAZAR) TRABAJADORES DE UNA FINCA ----------------
router.post('/fincas/:id/trabajadores', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    const fincaId = req.params.id;
    const { trabajadores } = req.body; // array de objetos: { nombre, sueldo }

    // Obtener rol y jefe_id del usuario
    const userResult = await pool.query('SELECT rol, jefe_id FROM usuarios WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const { rol, jefe_id } = userResult.rows[0];
    const propietarioId = rol === 'trabajador' ? jefe_id : userId;

    // Verificar que la finca pertenece al propietario (jefe o el mismo usuario si no es trabajador)
    const finca = await pool.query(
      'SELECT id FROM fincas WHERE id = $1 AND usuario_id = $2',
      [fincaId, propietarioId]
    );

    if (finca.rows.length === 0) {
      return res.status(403).json({ message: 'Acceso no autorizado a esta finca.' });
    }

    // Insertar nuevos trabajadores sin borrar los anteriores
    for (const trabajador of trabajadores) {
      await pool.query(
        'INSERT INTO trabajadores (nombre, sueldo, finca_id) VALUES ($1, $2, $3)',
        [trabajador.nombre, trabajador.sueldo, fincaId]
      );
    }

    res.status(200).json({ message: 'Trabajadores agregados correctamente.' });
  } catch (err) {
    console.error('Error al guardar trabajadores:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});


// ---------------- ELIMINAR TRABAJADOR DE UNA FINCA ----------------
router.delete('/fincas/:fincaId/trabajadores/:trabajadorId', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    const { fincaId, trabajadorId } = req.params;

    // Validar que la finca es del usuario
    const finca = await pool.query('SELECT id FROM fincas WHERE id = $1 AND usuario_id = $2', [fincaId, userId]);
    if (finca.rows.length === 0) {
      return res.status(403).json({ message: 'Acceso no autorizado a esta finca.' });
    }

    // Borrar trabajador por ID y finca_id para evitar eliminar trabajador de otra finca
    const result = await pool.query(
      'DELETE FROM trabajadores WHERE id = $1 AND finca_id = $2',
      [trabajadorId, fincaId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Trabajador no encontrado o no pertenece a la finca.' });
    }

    res.status(200).json({ message: 'Trabajador eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar trabajador:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});


// GET calendario de cultivo (fechas en formato 'YYYY-MM-DD')
router.get('/fincas/:id/calendario', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM calendario_cultivo WHERE finca_id = $1 ORDER BY fecha_inicio ASC',
      [id]
    );

    const calendarioFormateado = result.rows.map(etapa => ({
      ...etapa,
      // Convierte Date a string 'YYYY-MM-DD' para evitar desfase
      fecha_inicio: etapa.fecha_inicio.toISOString().split('T')[0],
      fecha_fin: etapa.fecha_fin.toISOString().split('T')[0],
    }));

    res.json({ calendario: calendarioFormateado });
  } catch (error) {
    console.error('Error al obtener calendario:', error);
    res.status(500).json({ error: 'Error al obtener calendario' });
  }
});

// POST guardar calendario (reemplaza etapas anteriores)
router.post('/fincas/:id/calendario', async (req, res) => {
  try {
    const { id } = req.params;
    const { calendario } = req.body;

    // Borra etapas anteriores para esta finca
    await pool.query('DELETE FROM calendario_cultivo WHERE finca_id = $1', [id]);

    // Inserta nuevas etapas sin convertir fechas (debe ser string 'YYYY-MM-DD')
    const insertPromises = calendario.map(etapa =>
      pool.query(
        'INSERT INTO calendario_cultivo (finca_id, etapa, fecha_inicio, fecha_fin) VALUES ($1, $2, $3, $4)',
        [id, etapa.etapa, etapa.fecha_inicio, etapa.fecha_fin]
      )
    );

    await Promise.all(insertPromises);
    res.json({ message: 'Calendario guardado correctamente' });
  } catch (error) {
    console.error('Error al guardar calendario:', error);
    res.status(500).json({ error: 'Error al guardar calendario' });
  }
});

// Obtener tareas de una finca
router.get('/fincas/:id/tareas', async (req, res) => {
  const fincaId = req.params.id;
  console.log('Buscando tareas para finca ID:', fincaId);
  try {
    const result = await pool.query(
      'SELECT * FROM tareas WHERE finca_id = $1 ORDER BY creada_en',
      [fincaId]
    );
    res.json({ tareas: result.rows });
  } catch (err) {
    console.error('Error en /fincas/:id/tareas:', err);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

// Guardar (reemplazar) tareas de una finca sin transacciones explícitas
router.post('/fincas/:id/tareas', async (req, res) => {
  const fincaId = req.params.id;
  const { tareas } = req.body;

  console.log('✅ Recibiendo tareas para guardar:', tareas);

  try {
    await pool.query('DELETE FROM tareas WHERE finca_id = $1', [fincaId]);

    const insertPromises = tareas.map((tarea) =>
      pool.query(
        `INSERT INTO tareas(finca_id, titulo, descripcion, trabajadores, completada, fecha_inicio, fecha_fin)
         VALUES($1, $2, $3, $4, $5, $6, $7)`,
        [
          fincaId,
          tarea.titulo,
          tarea.descripcion,
          tarea.trabajadores,
          tarea.completada || false,
          tarea.fecha_inicio || null,
          tarea.fecha_fin || null,
        ]
      )
    );

    await Promise.all(insertPromises);

    res.json({ mensaje: 'Tareas actualizadas' });
  } catch (err) {
    console.error('❌ Error al guardar tareas:', err);
    res.status(500).json({ error: 'Error al guardar tareas' });
  }
});



router.patch('/fincas/:fincaId/tareas/:tareaId', async (req, res) => {
  const { fincaId, tareaId } = req.params
  const { completada } = req.body

  if (typeof completada !== 'boolean') {
    return res.status(400).json({ error: 'Valor inválido para completada' })
  }

  try {
    const result = await pool.query(
      'UPDATE tareas SET completada = $1 WHERE id = $2 AND finca_id = $3 RETURNING *',
      [completada, tareaId, fincaId]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' })
    }
    res.json({ tarea: result.rows[0] })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar tarea' })
  }
})


// Obtener tareas de todas las fincas del usuario autenticado
router.get('/fincas/tareas-multiples', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    // Obtener el jefe_id del usuario actual (si existe)
    const userResult = await pool.query(
      'SELECT jefe_id FROM usuarios WHERE id = $1',
      [userId]
    );

    const jefeId = userResult.rows[0]?.jefe_id;

    const tareasResult = await pool.query(
      `SELECT t.id, t.titulo, t.descripcion, t.trabajadores, t.completada, t.creada_en,
              t.finca_id, f.nombre as finca_nombre, t.fecha_inicio, t.fecha_fin
       FROM tareas t
       JOIN fincas f ON t.finca_id = f.id
       WHERE f.usuario_id = $1
          ${jefeId ? 'OR f.usuario_id = $2' : ''}
       ORDER BY t.creada_en DESC`,
      jefeId ? [userId, jefeId] : [userId]
    );

    const tareas = tareasResult.rows;
    res.status(200).json({ tareas });

  } catch (err) {
    console.error('❌ Error al obtener tareas del usuario o su jefe:', err);
    res.status(500).json({ message: 'Error al obtener tareas.' });
  }
});



// ---------------- GUARDAR TAREAS ----------------

router.post('/fincas/tareas-multiples/guardar', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    const tareas = req.body.tareas; // array de tareas que envías desde el frontend

    for (const tarea of tareas) {
      // Ejemplo: insertar tarea (ajusta según estructura de tu tabla)
      await pool.query(
        `INSERT INTO tareas (id, titulo, descripcion, completada, finca_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           titulo = EXCLUDED.titulo,
           descripcion = EXCLUDED.descripcion,
           completada = EXCLUDED.completada,
           finca_id = EXCLUDED.finca_id`,
        [tarea.id, tarea.titulo, tarea.descripcion, tarea.completada, tarea.finca_id]
      );
    }

    res.status(200).json({ message: 'Tareas guardadas correctamente.' });
  } catch (err) {
    console.error('Error guardando tareas:', err);
    res.status(500).json({ message: 'Error al guardar tareas.' });
  }
});

// Ruta para que un consultor cree trabajadores
router.post('/register-trabajador', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const jefeId = decoded.id; // este será el jefe_id del trabajador

    const { username, email, telefono, password } = req.body;

    // Verificar si el correo ya existe
    const userExists = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado.' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo trabajador con el jefe_id
    await pool.query(
      `INSERT INTO usuarios (nombre, correo, telefono, contraseña, rol, jefe_id)
       VALUES ($1, $2, $3, $4, 'trabajador', $5)`,
      [username, email, telefono, hashedPassword, jefeId]
    );

    res.status(201).json({ message: 'Trabajador registrado con éxito.' });

  } catch (err) {
    console.error('Error al registrar trabajador:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});




router.post('/gastos', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const jefeId = decoded.id; // este será el dueño del gasto o el jefe

    const { finca_id, descripcion, cantidad } = req.body;

    // Insertar gasto con relación a la finca y validando que la finca pertenezca al jefe, si aplica
    await pool.query(
      `INSERT INTO gastos (finca_id, descripcion, cantidad)
       VALUES ($1, $2, $3)`,
      [finca_id, descripcion, cantidad]
    );

    res.status(201).json({ message: 'Gasto registrado con éxito.' });

  } catch (err) {
    console.error('Error al registrar gasto:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});
// Ruta para obtener un resumen de gastos de todas las fincas del usuario autenticado
router.get('/gastos/resumen', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    const resumenResult = await pool.query(
      `SELECT 
         f.id AS finca_id, 
         f.nombre AS finca_nombre, 
         f.tamano,
         f.tipo_cultivo,
         COALESCE(f.dinero_ganado, 0) AS dinero_ganado,
         COALESCE(f.dinero_gastado, 0) AS dinero_gastado,
         COALESCE(SUM(g.cantidad), 0) AS total_gastos
       FROM fincas f
       LEFT JOIN gastos g ON g.finca_id = f.id
       WHERE f.usuario_id = $1
       GROUP BY f.id, f.nombre, f.tamano, f.tipo_cultivo, f.dinero_ganado, f.dinero_gastado
       ORDER BY f.nombre`,
      [userId]
    );

    res.status(200).json({ resumen: resumenResult.rows });

  } catch (err) {
    console.error('Error al obtener resumen de gastos:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});

// Ruta para obtener los gastos de una finca específica del jefe autenticado
router.get('/gastos/:fincaId', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const fincaId = req.params.fincaId;

    // Consultar gastos solo si pertenecen al jefe autenticado
    const result = await pool.query(
      `SELECT * FROM gastos WHERE finca_id = $1`,
      [fincaId]
    );

    res.status(200).json(result.rows);

  } catch (err) {
    console.error('Error al obtener gastos:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});

// Nueva ruta para permitir POST /fincas/:id/ingresos
router.post('/fincas/:id/ingresos', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const jefeId = decoded.id;

    const finca_id = req.params.id;
    const { descripcion, cantidad } = req.body;

    // Validar que la finca pertenezca al usuario autenticado
    const fincaCheck = await pool.query(
      `SELECT * FROM fincas WHERE id = $1 AND usuario_id = $2`,
      [finca_id, jefeId]
    );

    if (fincaCheck.rowCount === 0) {
      return res.status(403).json({ message: 'No tienes acceso a esta finca.' });
    }

    // Iniciar transacción
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insertar ingreso
      await client.query(
        `INSERT INTO ingresos (finca_id, descripcion, cantidad)
         VALUES ($1, $2, $3)`,
        [finca_id, descripcion, cantidad]
      );

      // Actualizar dinero_ganado
      await client.query(
        `UPDATE fincas
         SET dinero_ganado = COALESCE(dinero_ganado, 0) + $1
         WHERE id = $2`,
        [cantidad, finca_id]
      );

      await client.query('COMMIT');
      res.status(201).json({ message: '✅ Ingreso registrado y dinero_ganado actualizado.' });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Error durante la transacción:', err);
      res.status(500).json({ message: 'Error del servidor al registrar ingreso.' });
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('❌ Error al registrar ingreso:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});

router.get('/ingresos/resumen', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    const resumenResult = await pool.query(
      `SELECT 
         f.id AS finca_id, 
         f.nombre AS finca_nombre, 
         f.tamano,
         f.tipo_cultivo,
         COALESCE(SUM(i.cantidad), 0) AS total_ingresos
       FROM fincas f
       LEFT JOIN ingresos i ON i.finca_id = f.id
       WHERE f.usuario_id = $1
       GROUP BY f.id, f.nombre, f.tamano, f.tipo_cultivo
       ORDER BY f.nombre`,
      [userId]
    );

    res.status(200).json({ resumen: resumenResult.rows });

  } catch (err) {
    console.error('Error al obtener resumen de ingresos:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});

router.get('/ingresos/:fincaId', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    const fincaId = req.params.fincaId;

    // Validar que la finca pertenece al usuario
    const fincaCheck = await pool.query(
      `SELECT * FROM fincas WHERE id = $1 AND usuario_id = $2`,
      [fincaId, userId]
    );

    if (fincaCheck.rowCount === 0) {
      return res.status(403).json({ message: 'No tienes acceso a esta finca.' });
    }

    const result = await pool.query(
      `SELECT * FROM ingresos WHERE finca_id = $1`,
      [fincaId]
    );

    res.status(200).json(result.rows);

  } catch (err) {
    console.error('Error al obtener ingresos:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});
// ---------------- OBTENER SUBORDINADOS DE UN JEFE ----------------
router.get('/usuarios/subordinados', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const jefeId = decoded.id;

    const result = await pool.query(
      `SELECT id, nombre, correo, telefono, rol, fecha_registro, activo
       FROM usuarios
       WHERE jefe_id = $1`,
      [jefeId]
    );

    res.status(200).json({ subordinados: result.rows });
  } catch (err) {
    console.error('Error al obtener subordinados:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});

router.delete('/api/usuarios/:id', async (req, res) => {
  // validar token, permisos, etc.
  const userId = parseInt(req.params.id)
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [userId])
    res.status(200).json({ message: 'Usuario eliminado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error eliminando usuario' })
  }
})

const PDFDocument = require('pdfkit');

const width = 600;
const height = 300;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });


// ---------------- GENERAR PDF DE UNA FINCA ----------------
router.get('/fincas/:id/pdf', async (req, res) => {
  try {
    const fincaId = req.params.id;

    // 1. Obtener finca
    const fincaResult = await pool.query(
      `SELECT id, nombre, tamano, tipo_cultivo, usuario_id, fecha_creacion, 
       objetivo_ingresos, dinero_gastado, dinero_ganado
       FROM fincas WHERE id = $1`,
      [fincaId]
    );

    if (fincaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Finca no encontrada' });
    }

    const finca = fincaResult.rows[0];

    // 2. Obtener gastos detallados
    const gastosResult = await pool.query(
      `SELECT descripcion, cantidad, fecha FROM gastos WHERE finca_id = $1 ORDER BY fecha`,
      [fincaId]
    );
    const gastos = gastosResult.rows;

    // 3. Obtener ingresos detallados
    const ingresosResult = await pool.query(
      `SELECT descripcion, cantidad, creado_en FROM ingresos WHERE finca_id = $1 ORDER BY creado_en`,
      [fincaId]
    );
    const ingresos = ingresosResult.rows;

    // 4. Obtener trabajadores detallados (nombre, sueldo)
    const trabajadoresResult = await pool.query(
      `SELECT nombre, sueldo FROM trabajadores WHERE finca_id = $1 ORDER BY nombre`,
      [fincaId]
    );
    const trabajadores = trabajadoresResult.rows;
    const trabajadoresCount = trabajadores.length;

    // 5. Sumar total gastos
    const totalGastos = gastos.reduce((sum, gasto) => sum + Number(gasto.cantidad || 0), 0);

    // 6. Crear configuración del gráfico
    const config = {
      type: 'bar',
      data: {
        labels: ['Dinero Ganado', 'Dinero Gastado'],
        datasets: [{
          label: finca.nombre,
          data: [Number(finca.dinero_ganado) || 0, totalGastos],
          backgroundColor: ['#4CAF50', '#F44336'],
        }],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Dinero Ganado vs Gastado',
            font: { size: 18 },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { size: 14 } }
          },
          x: {
            ticks: { font: { size: 14 } }
          }
        },
      },
    };

    // 7. Renderizar gráfico a imagen (buffer)
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config);

    // 8. Crear PDF y enviar
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=finca_${finca.id}.pdf`);

    doc.pipe(res);

    // 9. Título principal
    doc
      .font('Helvetica-Bold')
      .fontSize(26)
      .fillColor('#2E8B57')
      .text(`Informe finca: ${finca.nombre}`, { align: 'center' })
      .moveDown(1.5);

    // 10. Información básica finca con tamaño mayor y color
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#4B4B4B')
      .text('Información General', { underline: true })
      .moveDown(0.7);

    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor('#000')
      .text(`ID: ${finca.id}`)
      .text(`Nombre: ${finca.nombre}`)
      .text(`Tamaño: ${finca.tamano}`)
      .text(`Tipo de Cultivo: ${finca.tipo_cultivo}`)
      .text(`Usuario ID: ${finca.usuario_id}`)
      .text(`Fecha de Creación: ${new Date(finca.fecha_creacion).toLocaleDateString()}`)
      .text(`Objetivo de Ingresos: €${(Number(finca.objetivo_ingresos) || 0).toFixed(2)}`)
      .text(`Dinero Gastado (tabla fincas): €${(Number(finca.dinero_gastado) || 0).toFixed(2)}`)
      .text(`Dinero Ganado: €${(Number(finca.dinero_ganado) || 0).toFixed(2)}`)
      .moveDown(1);

    // 11. Trabajadores con estilo
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#4B4B4B')
      .text(`Trabajadores (${trabajadoresCount}):`, { underline: true })
      .moveDown(0.5);

    doc.font('Helvetica').fontSize(13).fillColor('#000');
    if (trabajadoresCount === 0) {
      doc.text('No hay trabajadores registrados.');
    } else {
      trabajadores.forEach(t => {
        const sueldoStr = t.sueldo ? ` - Sueldo: €${Number(t.sueldo).toFixed(2)}` : '';
        doc.text(`- ${t.nombre}${sueldoStr}`);
      });
    }
    doc.moveDown(1);

    // 12. Gastos detallados
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#4B4B4B')
      .text('Gastos detallados:', { underline: true })
      .moveDown(0.5);

    doc.font('Helvetica').fontSize(13).fillColor('#000');
    if (gastos.length === 0) {
      doc.text('No hay gastos registrados para esta finca.');
    } else {
      gastos.forEach(gasto => {
        const fecha = new Date(gasto.fecha).toLocaleDateString();
        const cantidad = Number(gasto.cantidad) || 0;
        doc.text(`- ${fecha}: ${gasto.descripcion} - €${cantidad.toFixed(2)}`);
      });
    }
    doc.moveDown(1);

    // 13. Ingresos detallados
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#4B4B4B')
      .text('Ingresos detallados:', { underline: true })
      .moveDown(0.5);

    doc.font('Helvetica').fontSize(13).fillColor('#000');
    if (ingresos.length === 0) {
      doc.text('No hay ingresos registrados para esta finca.');
    } else {
      ingresos.forEach(ingreso => {
        const fecha = new Date(ingreso.creado_en).toLocaleDateString();
        const cantidad = Number(ingreso.cantidad) || 0;
        doc.text(`- ${fecha}: ${ingreso.descripcion} - €${cantidad.toFixed(2)}`);
      });
    }
    doc.moveDown(1);

    // 14. Insertar gráfico con un borde y centrado
    const graphX = (doc.page.width - 500) / 2;
    doc
      .rect(graphX - 10, doc.y - 10, 520, 320)
      .strokeColor('#ddd')
      .lineWidth(1)
      .stroke();

    doc.image(imageBuffer, graphX, doc.y, { fit: [500, 300], align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error generando PDF con info y gráfico:', error);

    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generando PDF' });
    }
  }
});



// ---------------- OBTENER PDF CON TODAS LAS FINCAS ----------------
router.get('/fincas/pdf/todas', async (req, res) => {
  try {
    // 1. Obtener todas las fincas
    const fincasResult = await pool.query(
      `SELECT id, nombre, tamano, tipo_cultivo, usuario_id, fecha_creacion, 
              objetivo_ingresos, dinero_gastado, dinero_ganado
       FROM fincas ORDER BY id`
    );
    const fincas = fincasResult.rows;

    if (fincas.length === 0) {
      return res.status(404).json({ message: 'No hay fincas para generar PDF' });
    }

    // 2. Crear PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=fincas_todas.pdf');

    doc.pipe(res);

    for (let i = 0; i < fincas.length; i++) {
      const finca = fincas[i];

      // Obtener gastos detallados
      const gastosResult = await pool.query(
        `SELECT descripcion, cantidad, fecha FROM gastos WHERE finca_id = $1 ORDER BY fecha`,
        [finca.id]
      );
      const gastos = gastosResult.rows;

      // Obtener ingresos detallados
      const ingresosResult = await pool.query(
        `SELECT descripcion, cantidad, creado_en FROM ingresos WHERE finca_id = $1 ORDER BY creado_en`,
        [finca.id]
      );
      const ingresos = ingresosResult.rows;

      // Obtener trabajadores detallados (nombre, sueldo)
      const trabajadoresResult = await pool.query(
        `SELECT nombre, sueldo FROM trabajadores WHERE finca_id = $1 ORDER BY nombre`,
        [finca.id]
      );
      const trabajadores = trabajadoresResult.rows;
      const trabajadoresCount = trabajadores.length;

      // Sumar total gastos
      const totalGastos = gastos.reduce((sum, gasto) => sum + Number(gasto.cantidad || 0), 0);

      // Configuración gráfico
      const config = {
        type: 'bar',
        data: {
          labels: ['Dinero Ganado', 'Dinero Gastado'],
          datasets: [{
            label: finca.nombre,
            data: [Number(finca.dinero_ganado) || 0, totalGastos],
            backgroundColor: ['#4CAF50', '#F44336'],
          }],
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Dinero Ganado vs Gastado',
              font: { size: 18 },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { font: { size: 14 } }
            },
            x: {
              ticks: { font: { size: 14 } }
            }
          },
        },
      };

      const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config);

      // Agregar página nueva excepto la primera
      if (i > 0) doc.addPage();

      // Título principal finca
      doc
        .font('Helvetica-Bold')
        .fontSize(26)
        .fillColor('#2E8B57')
        .text(`Informe finca: ${finca.nombre}`, { align: 'center' })
        .moveDown(1.5);

      // Información general
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#4B4B4B')
        .text('Información General', { underline: true })
        .moveDown(0.7);

      doc
        .font('Helvetica')
        .fontSize(13)
        .fillColor('#000')
        .text(`ID: ${finca.id}`)
        .text(`Nombre: ${finca.nombre}`)
        .text(`Tamaño: ${finca.tamano}`)
        .text(`Tipo de Cultivo: ${finca.tipo_cultivo}`)
        .text(`Usuario ID: ${finca.usuario_id}`)
        .text(`Fecha de Creación: ${new Date(finca.fecha_creacion).toLocaleDateString()}`)
        .text(`Objetivo de Ingresos: €${(Number(finca.objetivo_ingresos) || 0).toFixed(2)}`)
        .text(`Dinero Gastado (tabla fincas): €${(Number(finca.dinero_gastado) || 0).toFixed(2)}`)
        .text(`Dinero Ganado: €${(Number(finca.dinero_ganado) || 0).toFixed(2)}`)
        .moveDown(1);

      // Trabajadores
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#4B4B4B')
        .text(`Trabajadores (${trabajadoresCount}):`, { underline: true })
        .moveDown(0.5);

      doc.font('Helvetica').fontSize(13).fillColor('#000');
      if (trabajadoresCount === 0) {
        doc.text('No hay trabajadores registrados.');
      } else {
        trabajadores.forEach(t => {
          const sueldoStr = t.sueldo ? ` - Sueldo: €${Number(t.sueldo).toFixed(2)}` : '';
          doc.text(`- ${t.nombre}${sueldoStr}`);
        });
      }
      doc.moveDown(1);

      // Gastos detallados
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#4B4B4B')
        .text('Gastos detallados:', { underline: true })
        .moveDown(0.5);

      doc.font('Helvetica').fontSize(13).fillColor('#000');
      if (gastos.length === 0) {
        doc.text('No hay gastos registrados para esta finca.');
      } else {
        gastos.forEach(gasto => {
          const fecha = new Date(gasto.fecha).toLocaleDateString();
          const cantidad = Number(gasto.cantidad) || 0;
          doc.text(`- ${fecha}: ${gasto.descripcion} - €${cantidad.toFixed(2)}`);
        });
      }
      doc.moveDown(1);

      // Ingresos detallados
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#4B4B4B')
        .text('Ingresos detallados:', { underline: true })
        .moveDown(0.5);

      doc.font('Helvetica').fontSize(13).fillColor('#000');
      if (ingresos.length === 0) {
        doc.text('No hay ingresos registrados para esta finca.');
      } else {
        ingresos.forEach(ingreso => {
          const fecha = new Date(ingreso.creado_en).toLocaleDateString();
          const cantidad = Number(ingreso.cantidad) || 0;
          doc.text(`- ${fecha}: ${ingreso.descripcion} - €${cantidad.toFixed(2)}`);
        });
      }
      doc.moveDown(1);

      // Insertar gráfico con borde y centrado
      const graphX = (doc.page.width - 500) / 2;
      doc
        .rect(graphX - 10, doc.y - 10, 520, 320)
        .strokeColor('#ddd')
        .lineWidth(1)
        .stroke();

      doc.image(imageBuffer, graphX, doc.y, { fit: [500, 300], align: 'center' });
    }

    doc.end();

  } catch (error) {
    console.error('Error generando PDF con todas las fincas:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generando PDF' });
    }
  }
});


// ---------------- RUTA PARA GUARDAR USUARIO ----------------

router.put('/usuarios/guardar', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    const { nombre, correo, telefono, contraseña } = req.body;

    let hashedPassword;
    if (contraseña) {
      hashedPassword = await bcrypt.hash(contraseña, 10);
    }

    let query = 'UPDATE usuarios SET nombre = $1, correo = $2, telefono = $3';
    const params = [nombre, correo, telefono];

    if (hashedPassword) {
      query += ', contraseña = $4 WHERE id = $5';
      params.push(hashedPassword, userId);
    } else {
      query += ' WHERE id = $4';
      params.push(userId);
    }

    await pool.query(query, params);

    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});

async function actualizarDineroGanado(fincaId) {
  const result = await pool.query(
    `SELECT COALESCE(SUM(cantidad), 0) AS total FROM ingresos WHERE finca_id = $1`,
    [fincaId]
  );

  const total = result.rows[0].total;

  await pool.query(
    `UPDATE fincas SET dinero_ganado = $1 WHERE id = $2`,
    [total, fincaId]
  );
}
// ---------------- CONTAR FINCAS DEL USUARIO ----------------
router.get('/fincas/count', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    // Contamos las fincas asociadas al jefe (ya sea el propio usuario o su jefe)
    const result = await pool.query(
      `SELECT COUNT(*) AS total
       FROM fincas
       WHERE usuario_id = $1`,
      [userId]
    );

    res.json({ totalFincas: Number(result.rows[0].total) });
  } catch (err) {
    console.error('❌ Error en /fincas/count:', err);
    res.status(500).json({ message: 'Error counting fincas.' });
  }
});

// ---------------- OBTENER PRODUCCIONES DE UNA FINCA ----------------
router.get('/fincas/:id/producciones', async (req, res) => {
  const fincaId = req.params.id;

  try {
    const result = await pool.query(
      'SELECT * FROM producciones WHERE finca_id = $1 ORDER BY fecha_inicio DESC',
      [fincaId]
    );
    res.json({ producciones: result.rows });
  } catch (error) {
    console.error('Error al obtener producciones:', error);
    res.status(500).json({ message: 'Error al obtener producciones' });
  }
});

// ---------------- AÑADIR PRODUCCIÓN A UNA FINCA ----------------
router.post('/fincas/:id/producciones', async (req, res) => {
  const fincaId = req.params.id;
  const { fecha_inicio, fecha_fin, tipo, cantidad, descripcion } = req.body;

  if (!fecha_inicio || !fecha_fin || !tipo || !cantidad) {
    return res.status(400).json({ message: 'Faltan campos obligatorios.' });
  }

  if (!['en_proceso', 'terminada'].includes(tipo)) {
    return res.status(400).json({ message: 'Tipo no válido' });
  }

  try {
    await pool.query(
      `INSERT INTO producciones (finca_id, fecha_inicio, fecha_fin, tipo, cantidad, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [fincaId, fecha_inicio, fecha_fin, tipo, cantidad, descripcion]
    );
    res.status(201).json({ message: '✅ Producción registrada' });
  } catch (error) {
    console.error('Error insertando producción:', error);
    res.status(500).json({ message: '❌ Error interno' });
  }
});


// Editar producción
router.put('/fincas/:fincaId/producciones/:id', async (req, res) => {
  const { fecha_inicio, fecha_fin, tipo, cantidad, descripcion } = req.body
  const { id } = req.params
  await pool.query(
    'UPDATE producciones SET fecha_inicio=$1, fecha_fin=$2, tipo=$3, cantidad=$4, descripcion=$5 WHERE id=$6',
    [fecha_inicio, fecha_fin, tipo, cantidad, descripcion, id]
  )
  res.json({ message: 'Actualizada' })
})

// Eliminar
router.delete('/fincas/:fincaId/producciones/:id', async (req, res) => {
  const { id } = req.params
  await pool.query('DELETE FROM producciones WHERE id = $1', [id])
  res.json({ message: 'Eliminada' })
})
// ---------------- CALCULAR RENDIMIENTO DE PRODUCCIONES ----------------
router.get('/fincas/:id/rendimiento-producciones', async (req, res) => {
  const fincaId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT
  p.id AS produccion_id,
  p.descripcion,
  p.tipo,
  p.fecha_inicio,
  p.fecha_fin,
  p.cantidad AS produccion,

  (
    SELECT COALESCE(SUM(g.cantidad), 0)
    FROM gastos g
    WHERE g.finca_id = p.finca_id
      AND g.fecha >= p.fecha_inicio
      AND g.fecha <= p.fecha_fin
  ) AS total_gastos,

  (
    SELECT COALESCE(SUM(i.cantidad), 0)
    FROM ingresos i
    WHERE i.finca_id = p.finca_id
      AND i.creado_en::date >= p.fecha_inicio
      AND i.creado_en::date <= p.fecha_fin
  ) AS total_ingresos,

  (
    (
      SELECT COALESCE(SUM(i.cantidad), 0)
      FROM ingresos i
      WHERE i.finca_id = p.finca_id
        AND i.creado_en::date >= p.fecha_inicio
        AND i.creado_en::date <= p.fecha_fin
    ) -
    (
      SELECT COALESCE(SUM(g.cantidad), 0)
      FROM gastos g
      WHERE g.finca_id = p.finca_id
        AND g.fecha >= p.fecha_inicio
        AND g.fecha <= p.fecha_fin
    )
  ) AS rendimiento

FROM producciones p
WHERE p.finca_id = $1
ORDER BY p.fecha_inicio DESC`,
      [fincaId]
    );
    res.json({ producciones: result.rows });
  } catch (error) {
    console.error('Error al obtener rendimiento:', error);
    res.status(500).json({ message: 'Error al obtener rendimiento' });
  }
});
// ---------------- LISTAR FINCAS CON GEOMETRÍA Y DATOS ECONÓMICOS PARA UNA FINCA UNICA ----------------
router.get('/fincas/:id', async (req, res) => {
  console.log('Hola desde la ruta de una finca única');
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    const fincaId = req.params.id;
    console.log(userId);

    // Obtener el rol y jefe_id del usuario
    const userResult = await pool.query(
      'SELECT rol, jefe_id FROM usuarios WHERE id = $1',
      [userId]
    );
    console.log(userResult);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const { rol, jefe_id } = userResult.rows[0];
    const ownerId = rol === 'trabajador' ? jefe_id : userId;

    // Buscar la finca que pertenezca al jefe o al usuario
    const result = await pool.query(
      `SELECT
         id,
         nombre,
         tamano,
         tipo_cultivo,
         usuario_id,
         fecha_creacion,
         objetivo_ingresos,
         dinero_gastado,
         dinero_ganado,
         ST_AsGeoJSON(ST_Centroid(ubicacion)) AS centroide_geojson,
         ST_AsGeoJSON(ubicacion) AS ubicacion_geojson
       FROM fincas
       WHERE usuario_id = $1 AND id = $2`,
      [ownerId, fincaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Finca no encontrada.' });
    }

    const finca = result.rows[0];

    const centroide = JSON.parse(finca.centroide_geojson);
    const [lon, lat] = centroide.coordinates;

    let municipio = 'Desconocido';
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: { lat, lon, format: 'json', addressdetails: 1 }
      });
      const addr = response.data.address;
      municipio = addr.city || addr.town || addr.village || addr.municipality || municipio;
    } catch (_) { }

    const restante = Math.max(
      finca.objetivo_ingresos - (finca.dinero_gastado + finca.dinero_ganado),
      0
    );

    res.status(200).json({
      ...finca,
      municipio,
      restante
    });

  } catch (err) {
    console.error('Error al obtener finca:', err);
    res.status(500).json({ message: 'Error del servidor.' });
  }
});
module.exports = router;
