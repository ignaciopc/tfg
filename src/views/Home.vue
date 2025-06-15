<template>
  <div class="dashboard container">
    <div class="row">
      <div class="card">Total de fincas: {{ totalFincas }}</div>
      <div class="card">Producción esperada: {{ formatCurrency(produccionEsperada) }}</div>
      <div class="card">Tareas pendientes: {{ tareasPendientes }}</div>
    </div>

    <div class="row">
      <div class="card large">
        <p>Reparto de gastos</p>
        <EarningsChart :ganado="dineroGanado" :gastado="dineroGastado" />
      </div>
      <div class="card large">
        <p>Mapa interactivo</p>
        <Map />
      </div>
    </div>

    <div class="row">
      <div class="card small">
        <router-link to="/fincas/lista">Ver detalles</router-link>
      </div>
      <div class="card large">
        <p>Lista de tareas</p>
        <ul>
          <li v-for="tarea in tareas" :key="tarea.id">
            {{ tarea.titulo }} - {{ tarea.completada ? '✅' : '❌' }}
          </li>
        </ul>
      </div>
    </div>

    <div class="button-row">
      <button @click="$router.push('/fincas/mapa')">+ Ver mapa</button>
      <button @click="$router.push('/finanzas/resumen')">Gastos por Finca</button>
      <button @click="$router.push('/tareas/lista')">Ver tareas</button>
      <button @click="$router.push('/documentos/generar')">Generar informe</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import EarningsChart from '../components/EarningsChart.vue'
import Map from '../components/Map.vue'

const totalFincas = ref(0)
const produccionEsperada = ref(0)
const tareasPendientes = ref(0)
const tareas = ref([])
const dineroGanado = ref(0)
const dineroGastado = ref(0)

const fetchDashboardData = async () => {
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  try {
    const countRes = await fetch('http://localhost:3000/api/fincas/count', { headers })
    const countData = await countRes.json()
    totalFincas.value = countData.totalFincas || 0

    const tareasRes = await fetch('http://localhost:3000/api/fincas/tareas-multiples', { headers })
    const tareasData = await tareasRes.json()
    tareas.value = tareasData.tareas || []
    tareasPendientes.value = tareas.value.filter(t => !t.completada).length

    const resumenRes = await fetch('http://localhost:3000/api/gastos/resumen', { headers })
    const resumenData = await resumenRes.json()

    if (resumenData?.resumen?.length) {
      let ganado = 0
      let gastado = 0
      resumenData.resumen.forEach(finca => {
        ganado += Number(finca.dinero_ganado) || 0
        gastado += Number(finca.dinero_gastado) || 0
      })
      dineroGanado.value = ganado
      dineroGastado.value = gastado
      produccionEsperada.value = ganado - gastado
    }

  } catch (e) {
    console.error('Error al cargar datos del dashboard:', e)
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

onMounted(fetchDashboardData)
</script>

<style scoped>
.dashboard {
  padding: 20px;
  font-family: sans-serif;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.card {
  background-color: #f4f4f4;
  padding: 20px;
  border-radius: 8px;
  flex: 1;
  min-height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.card.large {
  flex: 2;
  min-width: 300px;
}

.card.small {
  flex: 0.5;
  min-width: 150px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 10px 15px;
  border: none;
  background-color: #3498db;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  flex: 1;
  min-width: 180px;
}

button:hover {
  background-color: #2980b9;
}

/* 📱 Responsive para móviles */
@media (max-width: 768px) {
  .row {
    flex-direction: column;
  }

  .card {
    width: 100%;
  }

  .button-row {
    flex-direction: column;
  }

  button {
    width: 100%;
  }
}
</style>
