const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});


// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Rutas
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);  // El prefijo '/api' se aplica aquí

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});
