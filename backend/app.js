const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet'); // Importar helmet
const fincasRouter = require('./routes/fincas');
const authRoutes = require('./routes/auth');
const usuariosRouter = require('./routes/usuarios');
require('dotenv').config();

const app = express();

// ✅ Seguridad: usar helmet para cabeceras HTTP seguras
app.use(helmet());

// ✅ Middleware mejorado para CORS dinámico
const allowedOrigins = [
  'https://tfg-xi-jet.vercel.app',
  'http://localhost:5173',
  'https://proyecto-final-grado-alpha.vercel.app',
  'https://ignaciopc.github.io'  // Tu dominio GitHub Pages
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// ✅ Parseo de JSON
app.use(bodyParser.json());

// ✅ Ruta raíz para test rápido
app.get('/', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente' });
});

// ✅ Rutas
app.use('/api', authRoutes);
app.use('/api/fincas', fincasRouter);
app.use('/api/usuarios', usuariosRouter);

// ✅ Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// ✅ Error general
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// ✅ Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
