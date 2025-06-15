// app.js
const express = require('express');
const bodyParser = require('body-parser');
const fincasRouter = require('./routes/fincas');
const authRoutes = require('./routes/auth');
const usuariosRouter = require('./routes/usuarios');
require('dotenv').config();

const app = express();

// ✅ Middleware manual para CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://tfg-xi-jet.vercel.app");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");

  // Manejo de solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// ✅ Parseo de JSON
app.use(bodyParser.json()); // O puedes usar app.use(express.json());

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
