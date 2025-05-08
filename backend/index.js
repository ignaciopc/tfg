const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes = require('./routes/auth'); // Asegúrate de usar la ruta correcta

app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
