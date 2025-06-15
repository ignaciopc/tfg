<template>
  <div class="map-wrapper">
    <div id="map" class="map-container"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'
import 'leaflet-geosearch/dist/geosearch.css'
import axios from 'axios'

const router = useRouter()

onMounted(async () => {
  const map = L.map('map').setView([40, -3], 6)

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri'
  }).addTo(map)

  const provider = new OpenStreetMapProvider()
  const searchControl = new GeoSearchControl({
    provider,
    style: 'bar',
    autoComplete: true,
    autoCompleteDelay: 250,
    showMarker: true,
    showPopup: false,
    retainZoomLevel: false,
    animateZoom: true,
  })
  map.addControl(searchControl)

  const token = localStorage.getItem('token')
  if (!token) {
    console.error('No hay token de autenticación.')
    return
  }

  try {
    const response = await axios.get('http://localhost:3000/api/fincas/lista', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const fincas = response.data.fincas
    const layers = []

    fincas.forEach(finca => {
      if (!finca.ubicacion_geojson) return

      const geojson = JSON.parse(finca.ubicacion_geojson)

      const layer = L.geoJSON(geojson, {
        style: {
          color: '#3388ff',
          weight: 2
        },
        onEachFeature: function (feature, layer) {
          layer.on('click', () => {
            router.push(`/fincas/detalles/${finca.id}`)
          })
          layer.bindPopup(`<b>${finca.nombre}</b><br>Click para ver detalles.`)
        }
      }).addTo(map)
      layers.push(layer)

      if (finca.centroide_geojson && JSON.parse(finca.centroide_geojson).type === 'Point') {
        const centroide = JSON.parse(finca.centroide_geojson)
        const lat = centroide.coordinates[1]
        const lon = centroide.coordinates[0]

        const marker = L.marker([lat, lon])
          .addTo(map)
          .bindPopup(`
            <b>${finca.nombre}</b><br>
            Cultivo: ${finca.tipo_cultivo}<br>
            Tamaño: ${finca.tamano} ha<br>
            Municipio: ${finca.municipio}<br>
            <i>Haz clic en el polígono para ver detalles</i>
          `)

        layers.push(marker)
      }
    })

    if (layers.length > 0) {
      const group = L.featureGroup(layers)
      map.fitBounds(group.getBounds().pad(0.2))
      setTimeout(() => map.invalidateSize(), 100)
    }

  } catch (error) {
    console.error('Error al cargar fincas desde el backend:', error.response?.data || error.message)
  }
})
</script>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 100%;
  padding: 10px;
}

.map-container {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
}
</style>
