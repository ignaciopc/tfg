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

      <div id="map" class="map-responsive"></div>

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

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri',
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

    // Fix de tamaño en móviles
    setTimeout(() => {
      map.invalidateSize();
    }, 500);
  },
  methods: {
    guardarFinca() {
      if (!this.polygonCoords) {
        alert('Dibuja la finca en el mapa.');
        return;
      }

      const coordinates = this.polygonCoords.map(coord => [coord.lng, coord.lat]);
      coordinates.push([this.polygonCoords[0].lng, this.polygonCoords[0].lat]);

      const geojson = {
        type: 'Polygon',
        coordinates: [coordinates],
      };

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión para registrar una finca.');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL;

      this.$axios
        .post(
          `${apiUrl}/api/fincas/crear`,
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
        .catch(err => {
          console.error('Error al guardar finca:', err);
          const errorMessage = err.response?.data?.message || 'Error desconocido';
          alert('Error al guardar finca: ' + errorMessage);
        });
    }
  },
};
</script>

<style scoped>
.form-container {
  max-width: 700px;
  margin: 20px auto;
  padding: 20px;
  background: #f4f4f4;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
  margin-bottom: 12px;
  font-size: 16px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

button {
  margin-top: 15px;
  padding: 12px;
  font-size: 16px;
  background-color: #3e7c2d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.2s ease-in-out;
}

button:hover {
  background-color: #2b5b1e;
}

.map-responsive {
  height: 400px;
  width: 100%;
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.15);
}

/* Responsive */
@media (max-width: 768px) {
  .form-container {
    padding: 15px;
    margin: 15px;
  }

  .map-responsive {
    height: 300px;
  }

  .finca-form input {
    font-size: 14px;
  }

  button {
    font-size: 14px;
    padding: 10px;
  }
}
</style>
