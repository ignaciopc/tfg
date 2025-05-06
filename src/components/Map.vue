<template>
    <div id="map" class="map-container"></div>
  </template>
  
  <script setup>
  import { onMounted, ref } from 'vue'
  import L from 'leaflet'
  
  const mapContainer = ref(null)
  
  onMounted(() => {
    // Crear el mapa y configurarlo
    const map = L.map(mapContainer.value).setView([40.7128, -74.0060], 13); // Cambia estas coordenadas a las de tu preferencia
  
    // Agregar capa de mapa usando OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  
    // Agregar un marcador de ejemplo
    L.marker([40.7128, -74.0060]).addTo(map)
      .bindPopup('<b>¡Hola!</b><br>Este es un marcador.')
      .openPopup();
  })
  </script>
  
  <style scoped>
  .map-container {
    height: 400px; /* Ajusta la altura del mapa */
    width: 100%; /* Se adapta al tamaño del contenedor */
  }
  </style>
  