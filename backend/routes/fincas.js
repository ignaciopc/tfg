// backend/routes/fincas.js (ejemplo)
const express = require('express');
const router = express.Router();

// Simulación de base de datos
const fincas = [
  {
    nombre: "Finca El Roble",
    tipo_cultivo: "Olivo",
    tamano: 15,
    ubicacion: {
      type: "Polygon",
      coordinates: [
        [
          [-3.7, 40.4],
          [-3.7, 40.5],
          [-3.6, 40.5],
          [-3.6, 40.4],
          [-3.7, 40.4]
        ]
      ]
    }
  },
  // ... más fincas
];

router.get('/lista', (req, res) => {
  res.json({ fincas });
});

module.exports = router;
