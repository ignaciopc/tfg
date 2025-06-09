<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-10">

        <!-- 🔖 Datos básicos -->
        <div class="card mb-4">
          <div class="card-header bg-primary text-white fw-bold">🔖 Datos básicos</div>
          <div class="card-body">
            <p><strong>Nombre:</strong> {{ finca.nombre }}</p>
            <p><strong>Ubicación (Municipio):</strong> {{ finca.municipio }}</p>
            <p><strong>Tamaño:</strong> {{ finca.tamano }} ha</p>
            <p><strong>Tipo de cultivo:</strong> {{ finca.tipo_cultivo }}</p>
            <p><strong>Propietario (Usuario ID):</strong> {{ finca.usuario_id }}</p>
          </div>
        </div>

        <!-- 💰 Sección Económica -->
        <div class="card mb-4">
          <div class="card-header bg-success text-white fw-bold">💰 Sección Económica</div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">Objetivo de ingresos:</label>
              <input v-model.number="finca.objetivo_ingresos" type="number" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Dinero gastado:</label>
              <input v-model.number="finca.dinero_gastado" type="number" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Dinero ganado:</label>
              <input v-model.number="finca.dinero_ganado" type="number" class="form-control" />
            </div>

            <button @click="guardarCambios" class="btn btn-sm btn-primary">💾 Guardar todos los cambios</button>

            <p class="mt-3"><strong>Ganancia estimada:</strong> ${{ finca.dinero_ganado - finca.dinero_gastado }}</p>

            <div class="mt-3">
              <label class="form-label">📊 Progreso económico:</label>
              <div class="progress">
                <div
                  class="progress-bar bg-success"
                  role="progressbar"
                  :style="{ width: progresoGanancia + '%' }"
                  :aria-valuenow="progresoGanancia"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {{ progresoGanancia.toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 👨‍🌾 Trabajadores -->
        <div class="card mb-4">
          <div class="card-header bg-info text-white fw-bold">👨‍🌾 Trabajadores</div>
          <div class="card-body">
            <ul class="list-group mb-3">
              <li
                v-for="(trabajador, index) in trabajadores"
                :key="trabajador.id || index"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{{ trabajador.nombre }}</strong> — ${{ trabajador.sueldo }}
                </div>
                <button @click="eliminarTrabajador(index)" class="btn btn-danger btn-sm">Eliminar</button>
              </li>
              <li v-if="trabajadores.length === 0" class="list-group-item">
                No hay trabajadores registrados.
              </li>
            </ul>

            <div class="mb-3 row g-2">
              <div class="col">
                <input v-model="nuevoTrabajador.nombre" type="text" class="form-control" placeholder="Nombre" />
              </div>
              <div class="col">
                <input v-model.number="nuevoTrabajador.sueldo" type="number" class="form-control" placeholder="Sueldo" />
              </div>
              <div class="col-auto">
                <button @click="agregarTrabajador" class="btn btn-success">Añadir</button>
              </div>
            </div>

            <button @click="guardarTrabajadores" class="btn btn-primary">
              💾 Guardar Trabajadores
            </button>
          </div>
        </div>

        <!-- 🗓️ Calendario de cultivo editable -->
        <div class="card mb-4">
          <div class="card-header bg-warning text-dark fw-bold">🗓️ Calendario de cultivo</div>
          <div class="card-body">

            <ul class="list-group list-group-flush mb-3">
              <li
                v-for="(etapa, index) in calendario"
                :key="etapa.id || index"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{{ etapa.etapa }}:</strong> {{ etapa.fecha_inicio }} hasta {{ etapa.fecha_fin }}
                </div>
                <button class="btn btn-sm btn-danger" @click="eliminarEtapa(index)">🗑️</button>
              </li>
              <li v-if="calendario.length === 0" class="list-group-item">
                No hay etapas registradas.
              </li>
            </ul>

            <div class="mb-3 row g-2">
              <div class="col">
                <input v-model="nuevaEtapa.etapa" type="text" class="form-control" placeholder="Nombre de la etapa" />
              </div>
              <div class="col">
                <input v-model="nuevaEtapa.fecha_inicio" type="date" class="form-control" />
              </div>
              <div class="col">
                <input v-model="nuevaEtapa.fecha_fin" type="date" class="form-control" />
              </div>
              <div class="col-auto">
                <button @click="agregarEtapa" class="btn btn-success">➕ Añadir</button>
              </div>
            </div>

            <button @click="guardarCalendario" class="btn btn-primary">
              💾 Guardar Calendario
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const finca = ref({})
const progresoGanancia = ref(0)
const route = useRoute()

// Datos Económicos
const calcularProgreso = () => {
  const meta = finca.value.objetivo_ingresos || 0
  const ganado = finca.value.dinero_ganado || 0
  progresoGanancia.value = meta > 0 ? (ganado / meta) * 100 : 0
}

const guardarCambios = async () => {
  const token = localStorage.getItem('token')
  if (!token) return alert('⚠️ No hay token')

  try {
    const res = await fetch(`http://localhost:3000/api/fincas/${finca.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        objetivo_ingresos: finca.value.objetivo_ingresos,
        dinero_gastado: finca.value.dinero_gastado,
        dinero_ganado: finca.value.dinero_ganado,
      })
    })

    if (!res.ok) throw new Error()
    alert('✅ Cambios guardados')
    calcularProgreso()
  } catch {
    alert('❌ Error al guardar')
  }
}

// Datos de la finca
const fetchFinca = async () => {
  const id = route.params.id
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`http://localhost:3000/api/fincas/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    finca.value = await res.json()
    calcularProgreso()
  } catch (e) {
    console.error(e)
  }
}

// 🧑‍🌾 Trabajadores
const trabajadores = ref([])
const nuevoTrabajador = ref({ nombre: '', sueldo: 0 })

const fetchTrabajadores = async () => {
  const id = route.params.id
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`http://localhost:3000/api/fincas/${id}/trabajadores`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    trabajadores.value = data.trabajadores || []
  } catch (e) {
    console.error(e)
  }
}

const agregarTrabajador = () => {
  if (!nuevoTrabajador.value.nombre || nuevoTrabajador.value.sueldo <= 0) {
    return alert('Datos inválidos')
  }
  trabajadores.value.push({ ...nuevoTrabajador.value })
  nuevoTrabajador.value = { nombre: '', sueldo: 0 }
}

const eliminarTrabajador = async (index) => {
  const trabajador = trabajadores.value[index]
  if (!trabajador?.id) return alert('No se puede eliminar')

  const token = localStorage.getItem('token')
  const fincaId = route.params.id

  try {
    const res = await fetch(`http://localhost:3000/api/fincas/${fincaId}/trabajadores/${trabajador.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error()
    alert('Eliminado')
    await fetchTrabajadores()
  } catch (e) {
    console.error(e)
    alert('Error al eliminar')
  }
}

const guardarTrabajadores = async () => {
  const id = route.params.id
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`http://localhost:3000/api/fincas/${id}/trabajadores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ trabajadores: trabajadores.value })
    })
    if (!res.ok) throw new Error()
    alert('Guardado correctamente')
    await fetchTrabajadores()
  } catch (e) {
    console.error(e)
    alert('Error al guardar')
  }
}

// 📅 Calendario de Cultivo
const calendario = ref([])
const nuevaEtapa = ref({ etapa: '', fecha_inicio: '', fecha_fin: '' })

const fetchCalendario = async () => {
  const fincaId = route.params.id
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`http://localhost:3000/api/fincas/${fincaId}/calendario`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    calendario.value = data.calendario || []
  } catch (e) {
    console.error('Error al obtener calendario:', e)
  }
}

const agregarEtapa = () => {
  const { etapa, fecha_inicio, fecha_fin } = nuevaEtapa.value
  if (!etapa || !fecha_inicio || !fecha_fin) {
    return alert('Completa todos los campos')
  }
  calendario.value.push({ ...nuevaEtapa.value })
  nuevaEtapa.value = { etapa: '', fecha_inicio: '', fecha_fin: '' }
}

const eliminarEtapa = (index) => {
  calendario.value.splice(index, 1)
}

const guardarCalendario = async () => {
  const fincaId = route.params.id
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`http://localhost:3000/api/fincas/${fincaId}/calendario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ calendario: calendario.value })
    })
    if (!res.ok) throw new Error()
    alert('✅ Calendario guardado')
    await fetchCalendario()
  } catch (e) {
    console.error(e)
    alert('❌ Error al guardar calendario')
  }
}

onMounted(async () => {
  await fetchFinca()
  await fetchTrabajadores()
  await fetchCalendario()
})
</script>
