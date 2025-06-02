<template>
  <div class="map-wrapper">
    <div id="map" class="map-container"></div>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

export default {
  name: 'MapaInteractivo',
  setup() {
    onMounted(() => {
      const map = L.map('map').setView([40, -3], 6);

      // Capa satelital
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

      // Datos simulados de fincas
      const data = {
        fincas: [
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
          {
            nombre: "Finca La Esperanza",
            tipo_cultivo: "Vino",
            tamano: 12,
            ubicacion: {
              type: "Polygon",
              coordinates: [
                [
                  [-3.8, 40.3],
                  [-3.8, 40.35],
                  [-3.75, 40.35],
                  [-3.75, 40.3],
                  [-3.8, 40.3]
                ]
              ]
            }
          }
        ]
      };

      // Dibujar fincas en el mapa
      data.fincas.forEach(finca => {
        const geojson = finca.ubicacion;

        const layer = L.geoJSON(geojson, {
          style: {
            color: '#3388ff',
            weight: 2
          }
        }).addTo(map);

        layer.bindPopup(`
          <b>${finca.nombre}</b><br>
          Cultivo: ${finca.tipo_cultivo}<br>
          Tamaño: ${finca.tamano} ha
        `);
      });
    });
  }
};
</script>

<style scoped>
.map-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background-color: #f0f0f0;
}

.map-container {
  width: 70vw;
  height: 70vh;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}
</style>
