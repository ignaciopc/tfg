<template>
  <div class="card mb-4 mt-4 container">
    <div class="card-header bg-secondary text-white fw-bold">📋 Tareas por Finca</div>
    <div class="card-body">
      
      <div v-if="loading" class="mb-3">Cargando tareas...</div>
      <div v-if="error" class="error mb-3">{{ error }}</div>

      <div v-if="!loading && Object.keys(tareasPorFinca).length === 0">
        No hay tareas registradas.
      </div>

      <div v-for="(tareas, finca) in tareasPorFinca" :key="finca" class="mb-4">
        <h5>Finca: {{ finca }}</h5>
        <ul class="list-group">
          <li
            v-for="(tarea, index) in tareas"
            :key="tarea.id || index"
            class="list-group-item d-flex justify-content-between align-items-center"
            :class="{ 'list-group-item-success': tarea.completada }"
          >
            <div>
              <strong>{{ tarea.titulo }}</strong><br />
              <small>{{ tarea.descripcion }}</small><br />
              <small><em>Asignados:</em> {{ tarea.trabajadores || 'Ninguno' }}</small><br />
            </div>

            <div class="btn-group btn-group-sm" role="group" aria-label="Acciones tarea">
              <button
                @click="toggleCompletada(tarea)"
                :class="tarea.completada ? 'btn btn-success' : 'btn btn-outline-secondary'"
                title="Marcar como completada"
              >
                ✔️
              </button>
              <button @click="eliminarTarea(finca, index)" class="btn btn-danger" title="Eliminar tarea">🗑️</button>
            </div>
          </li>
        </ul>
      </div>

      <hr />

    

      <button @click="guardarTareas" class="btn btn-primary">💾 Guardar Tareas</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const tareas = ref([]); // array plano de tareas
const tareasPorFinca = ref({}); // tareas agrupadas por finca_nombre
const fincas = ref([]); // listado de nombres de fincas para el select
const loading = ref(false);
const error = ref(null);

const nuevaTarea = ref({
  titulo: '',
  descripcion: '',
  trabajadores: '',
  completada: false,
  finca_nombre: '',
});

// Traer tareas del backend y agrupar por finca
const fetchTareas = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await axios.get('/api/fincas/tareas-multiples', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    tareas.value = Array.isArray(response.data.tareas) ? response.data.tareas : [];

    // Agrupar tareas por finca_nombre
    tareasPorFinca.value = tareas.value.reduce((acc, tarea) => {
      const finca = tarea.finca_nombre || 'Sin Finca';
      if (!acc[finca]) acc[finca] = [];
      acc[finca].push(tarea);
      return acc;
    }, {});

    // Obtener lista de fincas únicas para el select al añadir tarea
    fincas.value = [...new Set(tareas.value.map(t => t.finca_nombre))];
  } catch (err) {
    error.value = 'No se pudieron cargar las tareas';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Cambiar estado completada de una tarea localmente
const toggleCompletada = (tarea) => {
  tarea.completada = !tarea.completada;
};

// Eliminar tarea localmente
const eliminarTarea = (finca, index) => {
  tareasPorFinca.value[finca].splice(index, 1);
  // Si ya no quedan tareas en la finca, eliminar la propiedad para actualizar la vista
  if (tareasPorFinca.value[finca].length === 0) {
    delete tareasPorFinca.value[finca];
  }
};



// Guardar tareas en backend — las “aplanamos” para enviar solo el array plano
const guardarTareas = async () => {
  loading.value = true;
  error.value = null;

  // Aplanar el objeto agrupado en array
  const tareasPlanas = Object.values(tareasPorFinca.value).flat();

  try {
    await axios.post(
      '/api/fincas/tareas-multiples/guardar',
      { tareas: tareasPlanas },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }
    );
    alert('Tareas guardadas correctamente');
    // Opcional: volver a cargar tareas desde backend
    await fetchTareas();
  } catch (err) {
    error.value = 'Error guardando tareas';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchTareas);
</script>

<style scoped>
.error {
  color: red;
}
</style>
