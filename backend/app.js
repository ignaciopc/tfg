const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fincasRouter = require('./routes/fincas');
const authRoutes = require('./routes/auth');
const usuariosRouter = require('./routes/usuarios');
require('dotenv').config();

const app = express();

// 🛡️ CORS config
app.use(cors({
  origin: 'https://tfg-xi-jet.vercel.app', // tu frontend Vercel
  credentials: true,
}));

app.use(bodyParser.json());

// ✅ Tus rutas
app.use('/api', authRoutes);
app.use('/api/fincas', fincasRouter);
app.use('/api/usuarios', usuariosRouter);

// Manejo de errores y rutas 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
