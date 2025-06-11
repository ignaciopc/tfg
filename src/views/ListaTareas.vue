<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const fincaIds = [1, 2, 3]; // Ejemplo de IDs seleccionados
const tareas = ref([]);
const loading = ref(false);
const error = ref(null);

const fetchTareas = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await axios.get('/api/fincas/tareas-multiples', {
      params: { ids: fincaIds.join(',') }
    });
    tareas.value = response.data.tareas;
  } catch (err) {
    error.value = 'No se pudieron cargar las tareas';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchTareas);
</script>

<template>
  <div>
    <h2>Tareas de múltiples fincas</h2>
    <div v-if="loading">Cargando tareas...</div>
    <div v-if="error">{{ error }}</div>
    <ul v-if="tareas.length">
      <li v-for="tarea in tareas" :key="tarea.id">
        <strong>Finca {{ tarea.finca_id }}:</strong> {{ tarea.descripcion }} ({{ tarea.creada_en }})
      </li>
    </ul>
    <div v-else-if="!loading">No hay tareas disponibles</div>
  </div>
</template>
