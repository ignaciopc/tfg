// app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const fincasRouter = require('./routes/fincas');
const authRoutes = require('./routes/auth');
const usuariosRouter = require('./routes/usuarios'); // <-- Importa el router de usuarios

require('dotenv').config();

const app = express();

// Logger básico para cada petición
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middlewares
app.use(cors({
  origin: 'https://tfg-xi-jet.vercel.app', // tu frontend desplegado
  credentials: true
}));
app.use(bodyParser.json()); // También puedes usar app.use(express.json())

// Rutas
app.use('/api', authRoutes);
app.use('/api/fincas', fincasRouter);
app.use('/api/usuarios', usuariosRouter); // <-- Usa el router para usuarios con prefijo /api/usuarios

// Manejo básico de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo básico de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
