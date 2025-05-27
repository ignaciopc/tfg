<template>
  <div class="form-container">
    <h2>Registrar Nueva Finca</h2>

    <form @submit.prevent="guardarFinca" class="finca-form">
      <label>Nombre de la Finca:</label>
      <input type="text" v-model="nombre" required />

      <label>Tipo de Cultivo:</label>
      <input type="text" v-model="tipoCultivo" required />

      <label>Tamaño (ha):</label>
      <input type="number" step="0.1" v-model="tamano" required />

      <div id="map" style="height: 400px; margin-top: 20px;"></div>

      <button type="submit">Guardar Finca</button>
    </form>
  </div>
</template>

<script>
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

export default {
  data() {
    return {
      nombre: '',
      tipoCultivo: '',
      tamano: null,
      polygonCoords: null,
    };
  },
  mounted() {
    const map = L.map('map').setView([40, -3], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap contributors',
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: true,
        marker: false,
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
      },
    });

    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);
      this.polygonCoords = layer.getLatLngs()[0];
    });

    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      autoComplete: true,
      autoCompleteDelay: 250,
      showMarker: true,
      showPopup: false,
      retainZoomLevel: false,
      animateZoom: true,
    });

    map.addControl(searchControl);
  },
  methods: {
    guardarFinca() {
      if (!this.polygonCoords) {
        alert('Dibuja la finca en el mapa.');
        return;
      }

      const coordinates = this.polygonCoords.map((coord) => [coord.lng, coord.lat]);
      coordinates.push([this.polygonCoords[0].lng, this.polygonCoords[0].lat]);

      const geojson = {
        type: 'Polygon',
        coordinates: [coordinates],
      };
      console.log('GeoJSON que se va a enviar:', JSON.stringify(geojson, null, 2));

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión para registrar una finca.');
        return;
      }

      console.log('Enviando datos:', {
        nombre: this.nombre,
        tipoCultivo: this.tipoCultivo,
        tamano: this.tamano,
        ubicacion: geojson,
      });

      this.$axios
        .post(
          '/fincas/crear', // ✅ Ruta corregida
          {
            nombre: this.nombre,
            tipoCultivo: this.tipoCultivo,
            tamano: this.tamano,
            ubicacion: geojson,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then(() => {
          alert('Finca guardada con éxito');
          this.nombre = '';
          this.tipoCultivo = '';
          this.tamano = null;
        })
        .catch((err) => {
          console.log('Error completo:', err);
          const errorMessage = err.response?.data?.message || 'Error desconocido';
          alert('Error al guardar finca: ' + errorMessage);
        });
    },
  },
};
</script>

<style scoped>
.form-container {
  max-width: 600px;
  margin: 30px auto;
  padding: 20px;
  background: #f4f4f4;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.finca-form {
  display: flex;
  flex-direction: column;
}

.finca-form label {
  margin-top: 10px;
  font-weight: bold;
}

.finca-form input {
  padding: 8px;
  margin-bottom: 10px;
}

button {
  margin-top: 15px;
  padding: 10px;
  background-color: #3e7c2d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #2b5b1e;
}
</style>