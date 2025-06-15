<template>
  <div class="card mb-4 mt-4 container responsive-card">
    <div class="card-header bg-secondary text-white fw-bold">📋 Tareas por Finca</div>
    <div class="card-body">
      <div v-if="loading" class="mb-3">Cargando tareas...</div>
      <div v-if="error" class="error mb-3">{{ error }}</div>

      <div v-if="!loading && Object.keys(tareasPorFinca).length === 0">
        No hay tareas registradas.
      </div>

      <div
        v-for="(tareas, finca) in tareasPorFinca"
        :key="finca"
        class="mb-4 tarea-section"
      >
        <h5>Finca: {{ finca }}</h5>
        <ul class="list-group">
          <li
            v-for="(tarea, index) in tareas"
            :key="tarea.id || index"
            class="list-group-item d-flex justify-content-between align-items-start flex-wrap"
            :class="{ 'list-group-item-success': tarea.completada }"
          >
            <div class="tarea-detalles">
              <strong>{{ tarea.titulo }}</strong><br />
              <small>{{ tarea.descripcion }}</small><br />
              <small><em>Asignados:</em> {{ tarea.trabajadores || 'Ninguno' }}</small>
            </div>

            <div class="btn-group btn-group-sm tarea-botones" role="group" aria-label="Acciones tarea">
              <button
                @click="toggleCompletada(tarea)"
                :class="tarea.completada ? 'btn btn-success' : 'btn btn-outline-secondary'"
                title="Marcar como completada"
              >
                ✔️
              </button>
              <button
                @click="eliminarTarea(finca, index)"
                class="btn btn-danger"
                title="Eliminar tarea"
              >
                🗑️
              </button>
            </div>
          </li>
        </ul>
      </div>

      <hr />

      <button @click="guardarTareas" class="btn btn-primary w-100 mt-3">💾 Guardar Tareas</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const tareas = ref([]);
const tareasPorFinca = ref({});
const fincas = ref([]);
const loading = ref(false);
const error = ref(null);

const nuevaTarea = ref({
  titulo: '',
  descripcion: '',
  trabajadores: '',
  completada: false,
  finca_nombre: '',
});

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

    tareasPorFinca.value = tareas.value.reduce((acc, tarea) => {
      const finca = tarea.finca_nombre || 'Sin Finca';
      if (!acc[finca]) acc[finca] = [];
      acc[finca].push(tarea);
      return acc;
    }, {});

    fincas.value = [...new Set(tareas.value.map(t => t.finca_nombre))];
  } catch (err) {
    error.value = 'No se pudieron cargar las tareas';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const toggleCompletada = (tarea) => {
  tarea.completada = !tarea.completada;
};

const eliminarTarea = (finca, index) => {
  tareasPorFinca.value[finca].splice(index, 1);
  if (tareasPorFinca.value[finca].length === 0) {
    delete tareasPorFinca.value[finca];
  }
};

const guardarTareas = async () => {
  loading.value = true;
  error.value = null;
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

.tarea-section h5 {
  margin-bottom: 10px;
}

.tarea-detalles {
  flex: 1 1 70%;
  font-size: 14px;
}

.tarea-botones {
  flex: 1 1 25%;
  display: flex;
  justify-content: flex-end;
  gap: 5px;
}

@media (max-width: 768px) {
  .tarea-detalles {
    flex: 1 1 100%;
    margin-bottom: 10px;
  }

  .tarea-botones {
    flex: 1 1 100%;
    justify-content: flex-start;
  }

  .list-group-item {
    flex-direction: column;
    align-items: flex-start !important;
  }

  .btn-group {
    width: 100%;
    display: flex;
    justify-content: flex-start;
  }
}
</style>
