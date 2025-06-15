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

    const userResult = await pool.query('SELECT id, nombre, rol FROM usuarios WHERE id = $1', [userId]);
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

    const tareasResult = await pool.query(
      `SELECT t.id, t.titulo, t.descripcion, t.trabajadores, t.completada, t.creada_en,
       t.finca_id, f.nombre as finca_nombre, t.fecha_inicio, t.fecha_fin
FROM tareas t
JOIN fincas f ON t.finca_id = f.id
WHERE f.usuario_id = $1
ORDER BY t.creada_en DESC
`,
      [userId]
    );

    const tareas = tareasResult.rows;

    res.status(200).json({ tareas });
  } catch (err) {
    console.error('❌ Error al obtener tareas del usuario:', err);
    res.status(500).json({ message: 'Error al obtener tareas del usuario.' });
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

router.post('/ingresos', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No se proporcionó token.' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const jefeId = decoded.id;

    const { finca_id, descripcion, cantidad } = req.body;

    // Validar que la finca pertenezca al usuario autenticado
    const fincaCheck = await pool.query(
      `SELECT * FROM fincas WHERE id = $1 AND usuario_id = $2`,
      [finca_id, jefeId]
    );

    if (fincaCheck.rowCount === 0) {
      return res.status(403).json({ message: 'No tienes acceso a esta finca.' });
    }

    // Insertar ingreso
    await pool.query(
      `INSERT INTO ingresos (finca_id, descripcion, cantidad)
       VALUES ($1, $2, $3)`,
      [finca_id, descripcion, cantidad]
    );

    res.status(201).json({ message: 'Ingreso registrado con éxito.' });

  } catch (err) {
    console.error('Error al registrar ingreso:', err);
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

router.get('/fincas/:id/pdf', async (req, res) => {
  try {
    const fincaId = req.params.id;

    // 1. Obtener finca
    const fincaResult = await pool.query(
      `SELECT id, nombre, tamano, tipo_cultivo, usuario_id, fecha_creacion, 
       objetivo_ingresos, dinero_gastado, dinero_ganado, trabajadores
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

    // 3. Sumar total gastos (por si quieres mostrar)
    const totalGastos = gastos.reduce((sum, gasto) => sum + Number(gasto.cantidad || 0), 0);

    // 4. Crear configuración del gráfico
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
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };

    // 5. Renderizar gráfico a imagen (buffer)
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config);

    // 6. Crear PDF y enviar
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=finca_${finca.id}.pdf`);

    doc.pipe(res);

    // 7. Información finca
    doc.fontSize(20).text(`Informe finca: ${finca.nombre}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`ID: ${finca.id}`);
    doc.text(`Nombre: ${finca.nombre}`);
    doc.text(`Tamaño: ${finca.tamano}`);
    doc.text(`Tipo de Cultivo: ${finca.tipo_cultivo}`);
    doc.text(`Usuario ID: ${finca.usuario_id}`);
    doc.text(`Fecha de Creación: ${new Date(finca.fecha_creacion).toLocaleDateString()}`);

    const objetivoIngresos = Number(finca.objetivo_ingresos) || 0;
    doc.text(`Objetivo de Ingresos: €${objetivoIngresos.toFixed(2)}`);

    const dineroGastado = Number(finca.dinero_gastado) || 0;
    doc.text(`Dinero Gastado (tabla fincas): €${dineroGastado.toFixed(2)}`);

    const dineroGanado = Number(finca.dinero_ganado) || 0;
    doc.text(`Dinero Ganado: €${dineroGanado.toFixed(2)}`);

    const trabajadores = Number(finca.trabajadores) || 0;
    doc.text(`Trabajadores: ${trabajadores}`);

    doc.text(`Total Gastos (tabla gastos): €${totalGastos.toFixed(2)}`);
    doc.moveDown();

    // 8. Gastos detallados
    doc.fontSize(16).text('Gastos detallados:', { underline: true });
    doc.moveDown(0.5);

    if (gastos.length === 0) {
      doc.text('No hay gastos registrados para esta finca.');
    } else {
      gastos.forEach(gasto => {
        const fecha = new Date(gasto.fecha).toLocaleDateString();
        const cantidad = Number(gasto.cantidad) || 0;
        doc.text(`- ${fecha}: ${gasto.descripcion} - €${cantidad.toFixed(2)}`);
      });
    }

    doc.moveDown();

    // 9. Insertar gráfico
    doc.image(imageBuffer, { fit: [500, 300], align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error generando PDF con info y gráfico:', error);

    // Solo enviar respuesta de error si NO hemos empezado a enviar PDF
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
              objetivo_ingresos, dinero_gastado, dinero_ganado, trabajadores
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

    // 3. Iterar cada finca y agregar info, gastos y gráfico
    for (let i = 0; i < fincas.length; i++) {
      const finca = fincas[i];

      // Obtener gastos detallados
      const gastosResult = await pool.query(
        `SELECT descripcion, cantidad, fecha FROM gastos WHERE finca_id = $1 ORDER BY fecha`,
        [finca.id]
      );
      const gastos = gastosResult.rows;

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
            },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      };

      const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config);

      // Agregar página nueva excepto la primera
      if (i > 0) doc.addPage();

      // Info finca
      doc.fontSize(20).text(`Informe finca: ${finca.nombre}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(12);
      doc.text(`ID: ${finca.id}`);
      doc.text(`Nombre: ${finca.nombre}`);
      doc.text(`Tamaño: ${finca.tamano}`);
      doc.text(`Tipo de Cultivo: ${finca.tipo_cultivo}`);
      doc.text(`Usuario ID: ${finca.usuario_id}`);
      doc.text(`Fecha de Creación: ${new Date(finca.fecha_creacion).toLocaleDateString()}`);

      const objetivoIngresos = Number(finca.objetivo_ingresos) || 0;
      doc.text(`Objetivo de Ingresos: €${objetivoIngresos.toFixed(2)}`);

      const dineroGastado = Number(finca.dinero_gastado) || 0;
      doc.text(`Dinero Gastado (tabla fincas): €${dineroGastado.toFixed(2)}`);

      const dineroGanado = Number(finca.dinero_ganado) || 0;
      doc.text(`Dinero Ganado: €${dineroGanado.toFixed(2)}`);

      const trabajadores = Number(finca.trabajadores) || 0;
      doc.text(`Trabajadores: ${trabajadores}`);

      doc.text(`Total Gastos (tabla gastos): €${totalGastos.toFixed(2)}`);
      doc.moveDown();

      // Gastos detallados
      doc.fontSize(16).text('Gastos detallados:', { underline: true });
      doc.moveDown(0.5);

      if (gastos.length === 0) {
        doc.text('No hay gastos registrados para esta finca.');
      } else {
        gastos.forEach(gasto => {
          const fecha = new Date(gasto.fecha).toLocaleDateString();
          const cantidad = Number(gasto.cantidad) || 0;
          doc.text(`- ${fecha}: ${gasto.descripcion} - €${cantidad.toFixed(2)}`);
        });
      }

      doc.moveDown();

      // Insertar gráfico
      doc.image(imageBuffer, { fit: [500, 300], align: 'center' });
    }

    doc.end();

  } catch (error) {
    console.error('Error generando PDF con todas las fincas:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generando PDF' });
    }
  }
});
module.exports = router;
