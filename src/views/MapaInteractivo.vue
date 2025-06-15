<template>
  <div class="map-wrapper p-4 container rounded-4">
    <div id="map" class="map-container"></div>
    <button class="btn-centrar" @click="centrarUbicacion">📍 Mi ubicación</button>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import axios from 'axios';

export default {
  name: 'MapaInteractivo',
  setup() {
    const router = useRouter();
    const mapRef = ref(null);

    const centrarUbicacion = () => {
      if (!mapRef.value) return;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            L.marker([lat, lon])
              .addTo(mapRef.value)
              .bindPopup('Estás aquí 📍')
              .openPopup();

            mapRef.value.setView([lat, lon], 14);
          },
          error => {
            console.error('No se pudo obtener la ubicación:', error);
            alert('No se pudo obtener la ubicación.');
          }
        );
      } else {
        alert('La geolocalización no está disponible en este navegador.');
      }
    };

    onMounted(async () => {
      const map = L.map('map').setView([40, -3], 6);
      mapRef.value = map;

      // Capa base satelital
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
      }).addTo(map);

      // Buscador
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

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No hay token de autenticación.');
        return;
      }

      try {
        const response = await axios.get('http://localhost:3000/api/fincas/lista', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const fincas = response.data.fincas;
        const layers = [];

        fincas.forEach(finca => {
          if (!finca.ubicacion_geojson) return;

          const geojson = JSON.parse(finca.ubicacion_geojson);

          const layer = L.geoJSON(geojson, {
            style: {
              color: '#3388ff',
              weight: 2
            },
            onEachFeature: function (feature, layer) {
              layer.on('click', () => {
                router.push(`/fincas/detalles/${finca.id}`);
              });
              layer.bindPopup(`<b>${finca.nombre}</b><br>Click para ver detalles.`);
            }
          }).addTo(map);
          layers.push(layer);

          if (finca.centroide_geojson && JSON.parse(finca.centroide_geojson).type === 'Point') {
            const centroide = JSON.parse(finca.centroide_geojson);
            const lat = centroide.coordinates[1];
            const lon = centroide.coordinates[0];

            const marker = L.marker([lat, lon])
              .addTo(map)
              .bindPopup(`
                <b>${finca.nombre}</b><br>
                Cultivo: ${finca.tipo_cultivo}<br>
                Tamaño: ${finca.tamano} ha<br>
                Municipio: ${finca.municipio}<br>
                <i>Haz clic en el polígono para ver detalles</i>
              `);

            layers.push(marker);
          }
        });

        if (layers.length > 0) {
          const group = L.featureGroup(layers);
          map.fitBounds(group.getBounds().pad(0.2));
          setTimeout(() => map.invalidateSize(), 100);
        }

      } catch (error) {
        console.error('Error al cargar fincas desde el backend:', error.response?.data || error.message);
      }
    });

    return {
      centrarUbicacion
    };
  }
};
</script>

<style scoped>
.map-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 80vh;
  background-color: #f0f0f0;
  margin-top: 60px;
}

.map-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.btn-centrar {
  position: absolute;
  z-index: 1000;
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s;
}

/* Hover */
.btn-centrar:hover {
  background-color: #2980b9;
}

/* Responsive: abajo a la derecha en móviles */
/* 📱 Móviles: esquina inferior izquierda */
@media (max-width: 768px) {
  .btn-centrar {
    bottom: 15px;
    left: 15px;
    top: auto;
    right: auto;
  }
}

/* 🖥️ Escritorio: esquina superior derecha */
@media (min-width: 769px) {
  .btn-centrar {
    top: 15px;
    right: 15px;
    bottom: auto;
    left: auto;
  }
}
</style>
