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
          <div class="card mb-4" v-if="usuarioActual?.rol !== 'trabajador'">
            <div class="card-header bg-success text-white fw-bold">💰 Sección Económica</div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Objetivo de ingresos:</label>
                <input v-model.number="finca.objetivo_ingresos" type="number" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label">Dinero gastado:</label>
                <input v-model.number="finca.dinero_gastado" type="number" class="form-control" />
                <!-- 📑 Gastos Detallados -->
                <div class="mb-3">
                  <label class="form-label">📑 Gastos detallados:</label>
                  <ul class="list-group mb-2">
                    <li v-for="(gasto, index) in gastos" :key="index"
                      class="list-group-item d-flex justify-content-between">
                      <div>
                        <strong>{{ gasto.descripcion }}</strong>: ${{ gasto.cantidad }}
                      </div>
                    </li>
                    <li v-if="gastos.length === 0" class="list-group-item">No hay gastos registrados.</li>
                  </ul>

                  <div class="input-group">
                    <input v-model="nuevoGasto.descripcion" type="text" class="form-control"
                      placeholder="Descripción" />
                    <input v-model.number="nuevoGasto.cantidad" type="number" class="form-control"
                      placeholder="Cantidad" />
                    <button class="btn btn-outline-success" @click="agregarGasto">➕ Añadir gasto</button>
                  </div>
                </div>

              </div>
              <!-- 📈 Ingresos detallados -->

              <div class="mb-3">

                <label class="form-label">📈 Ingresos detallados:</label>
                <ul class="list-group mb-2">
                  <li v-for="(ingreso, index) in ingresos" :key="index"
                    class="list-group-item d-flex justify-content-between">
                    <div>
                      <strong>{{ ingreso.descripcion }}</strong>: ${{ ingreso.cantidad }}
                    </div>
                  </li>
                  <li v-if="ingresos.length === 0" class="list-group-item">No hay ingresos registrados.</li>
                </ul>

                <div class="input-group">
                  <input v-model="nuevoIngreso.descripcion" type="text" class="form-control"
                    placeholder="Descripción" />
                  <input v-model.number="nuevoIngreso.cantidad" type="number" class="form-control"
                    placeholder="Cantidad" />
                  <button class="btn btn-outline-success" @click="agregarIngreso">➕ Añadir ingreso</button>
                </div>

                <p class="mt-2"><strong>💵 Total ganado:</strong> ${{ finca.dinero_ganado }}</p>

              </div>

              <button @click="guardarTodo" class="btn btn-sm btn-primary">💾 Guardar todos los cambios</button>

              <p class="mt-3"><strong>Ganancia estimada:</strong> ${{ finca.dinero_ganado - finca.dinero_gastado }}</p>
              <div class="mt-3">
                <label class="form-label">📊 Progreso económico</label>
                <div class="progress">
                  <div class="progress-bar" :class="barraColor" role="progressbar"
                    :style="{ width: progresoGananciaReal + '%' }" :aria-valuenow="progresoGananciaReal"
                    aria-valuemin="0" aria-valuemax="100">
                    {{ progresoGananciaReal.toFixed(1) }}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 👨‍🌾 Trabajadores -->
          <div class="card mb-4" v-if="usuarioActual?.rol !== 'trabajador'">
            <div class="card-header bg-info text-white fw-bold">👨‍🌾 Trabajadores</div>
            <div class="card-body">
              <ul class="list-group mb-3">
                <li v-for="(trabajador, index) in trabajadores" :key="trabajador.id || index"
                  class="list-group-item d-flex justify-content-between align-items-center">
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
                  <input v-model.number="nuevoTrabajador.sueldo" type="number" class="form-control"
                    placeholder="Sueldo" />
                </div>
                <div class="col-auto">
                  <button @click="agregarTrabajador" class="btn btn-success">Añadir</button>
                </div>
              </div>

              <button @click="guardarTrabajadores" class="btn btn-primary">💾 Guardar Trabajadores</button>
            </div>
          </div>

          <!-- 🗓️ Calendario de cultivo -->
          <div class="card mb-4">
            <div class="card-header bg-warning text-dark fw-bold">🗓️ Calendario de cultivo</div>
            <div class="card-body">
              <ul class="list-group list-group-flush mb-3">
                <li v-for="(etapa, index) in calendario" :key="etapa.id || index"
                  class="list-group-item d-flex justify-content-between align-items-center">
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

              <button @click="guardarCalendario" class="btn btn-primary">💾 Guardar Calendario</button>
            </div>
          </div>

          <!-- 📋 Tareas -->
          <div class="card mb-4">
            <div class="card-header bg-secondary text-white fw-bold">📋 Tareas</div>
            <div class="card-body">
              <ul class="list-group mb-3">
                <li v-for="(tarea, index) in tareas" :key="tarea.id || index"
                  class="list-group-item d-flex justify-content-between align-items-center"
                  :class="{ 'list-group-item-success': tarea.completada }">
                  <div>
                    <strong>{{ tarea.titulo }}</strong><br />
                    <small>{{ tarea.descripcion }}</small><br />
                    <small><em>Asignados:</em> {{ tarea.trabajadores || 'Ninguno' }}</small>
                  </div>

                  <div class="btn-group btn-group-sm" role="group" aria-label="Acciones tarea">
                    <button @click="toggleCompletada(tarea)"
                      :class="tarea.completada ? 'btn btn-success' : 'btn btn-outline-secondary'"
                      title="Marcar como completada">
                      ✔️
                    </button>
                    <button @click="eliminarTarea(index)" class="btn btn-danger">🗑️</button>
                  </div>
                </li>
                <li v-if="tareas.length === 0" class="list-group-item">
                  No hay tareas registradas.
                </li>
              </ul>

              <div class="mb-3 row g-2">
                <div class="col">
                  <input v-model="nuevaTarea.titulo" type="text" class="form-control"
                    placeholder="Título de la tarea" />
                </div>
                <div class="col">
                  <input v-model="nuevaTarea.descripcion" type="text" class="form-control" placeholder="Descripción" />
                </div>
                <div class="col">
                  <input v-model="nuevaTarea.trabajadores" type="text" class="form-control"
                    placeholder="Trabajadores (separados por coma)" />
                </div>
                <div class="col">
                  <input v-model="nuevaTarea.fecha_inicio" type="date" class="form-control"
                    placeholder="Fecha inicio" />
                </div>
                <div class="col">
                  <input v-model="nuevaTarea.fecha_fin" type="date" class="form-control" placeholder="Fecha fin" />
                </div>

                <div class="col-auto">
                  <button @click="agregarTarea" class="btn btn-success">➕ Añadir</button>
                </div>
              </div>

              <button @click="guardarTareas" class="btn btn-primary">💾 Guardar Tareas</button>
            </div>
          </div>

          <!-- Fin de Tareas -->
          <!-- 📦 Producciones -->
          <div class="card mb-4">
            <div class="card-header bg-info text-white fw-bold">📦 Producciones</div>

            <div class="card-body">
              <ul class="list-group mb-3">
                <li v-for="(p, index) in producciones" :key="p.id"
                  class="list-group-item d-flex justify-content-between align-items-start">
                  <div class="ms-2 me-auto">
                    <div class="fw-bold">{{ p.tipo === 'en_proceso' ? '🟡 En proceso' : '✅ Terminada' }}</div>
                    <small>{{ formatearFecha(p.fecha_inicio) }} → {{ formatearFecha(p.fecha_fin) }}</small><br />
                    <small>{{ p.cantidad }} unidades</small><br />
                    <small class="text-muted">{{ p.descripcion }}</small>
                  </div>

                  <div class="btn-group btn-group-sm mt-2" role="group">
                    <button @click="editarProduccion(index)" class="btn btn-warning">✏️</button>
                    <button @click="eliminarProduccion(p.id)" class="btn btn-danger">🗑️</button>
                  </div>
                </li>
                <li v-if="producciones.length === 0" class="list-group-item">No hay producciones registradas.</li>
              </ul>

              <!-- Formulario -->
              <div class="row g-2 mb-3">
                <div class="col-md-2">
                  <input type="date" v-model="nuevaProduccion.fecha_inicio" class="form-control" required />
                </div>
                <div class="col-md-2">
                  <input type="date" v-model="nuevaProduccion.fecha_fin" class="form-control" required />
                </div>
                <div class="col-md-2">
                  <select v-model="nuevaProduccion.tipo" class="form-select" required>
                    <option disabled value="">Tipo</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="terminada">Terminada</option>
                  </select>
                </div>
                <div class="col-md-2">
                  <input type="number" v-model="nuevaProduccion.cantidad" class="form-control" placeholder="Cantidad"
                    required />
                </div>
                <div class="col-md-3">
                  <input type="text" v-model="nuevaProduccion.descripcion" class="form-control"
                    placeholder="Descripción" />
                </div>
                <div class="col-md-1">
                  <button @click="modoEdicion ? actualizarProduccion() : agregarProduccion()"
                    class="btn btn-success w-100">
                    {{ modoEdicion ? '💾' : '➕' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <!-- Fin de Producciones -->

          <div class="card mb-4">
            <div class="card-header bg-info text-white fw-bold">📈 Rendimiento por Producción</div>
            <div class="card-body">
              <ul class="list-group">
                <li v-for="r in rendimientoProducciones" :key="r.produccion_id" class="list-group-item">
                  <div class="fw-bold">{{ r.descripcion || 'Sin descripción' }}</div>
                  <small>📅 {{ formatearFecha(r.fecha_inicio) }} → {{ formatearFecha(r.fecha_fin) }}</small><br />
                  <small>📦 Producción: {{ r.produccion }} unidades</small><br />
                  <small>💸 Gastos: €{{ r.total_gastos }}</small><br />
                  <small>💰 Ingresos: €{{ r.total_ingresos }}</small><br />
                  <strong class="text-success">💹 Rendimiento: €{{ r.rendimiento }}</strong>
                </li>
                <li v-if="rendimientoProducciones.length === 0" class="list-group-item text-muted">
                  No hay datos de rendimiento aún.
                </li>
              </ul>
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

// 💰 Datos Económicos
const calcularProgreso = () => {
  const meta = finca.value.objetivo_ingresos || 0
  const ganado = finca.value.dinero_ganado || 0
  progresoGanancia.value = meta > 0 ? (ganado / meta) * 100 : 0
}

const guardarCambios = async () => {
  const token = localStorage.getItem('token')
  if (!token) return alert('⚠️ No hay token')

  try {
    finca.value.dinero_gastado = totalGastos.value  // 💡 forzamos actualización
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

const guardarTodo = async () => {
  try {
    await guardarCambios()      // guarda datos de la finca
    await guardarIngresos()     // guarda ingresos detallados
    alert('✅ Todos los cambios guardados correctamente')
  } catch (e) {
    console.error(e)
    alert('❌ Error al guardar todos los cambios')
  }
}



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

// 👨‍🌾 Trabajadores
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

// 🗓️ Calendario
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

// 📋 Tareas
const tareas = ref([])
const nuevaTarea = ref({ titulo: '', descripcion: '', trabajadores: '' })

const agregarTarea = () => {
  if (!nuevaTarea.value.titulo) {
    return alert('Título requerido')
  }
  tareas.value.push({ ...nuevaTarea.value, completada: false })  // agrego completada=false
  nuevaTarea.value = { titulo: '', descripcion: '', trabajadores: '' }
}

const eliminarTarea = (index) => {
  tareas.value.splice(index, 1)
}

const toggleCompletada = async (tarea) => {
  const token = localStorage.getItem('token')
  if (!token) return alert('⚠️ No hay token')

  try {
    // Cambio el estado localmente
    tarea.completada = !tarea.completada

    // Actualizo backend (si tienes API para eso)
    const fincaId = route.params.id
    if (!tarea.id) {
      alert('Esta tarea aún no está guardada en el servidor.')
      return
    }
    const res = await fetch(`http://localhost:3000/api/fincas/${fincaId}/tareas/${tarea.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ completada: tarea.completada })
    })

    if (!res.ok) throw new Error()

    alert(`Tarea ${tarea.completada ? 'marcada como completada' : 'marcada como pendiente'}`)

    await fetchTareas()
  } catch (error) {
    alert('❌ Error al actualizar estado')
    tarea.completada = !tarea.completada // revertir en caso de error
    console.error(error)
  }
}

const guardarTareas = async () => {
  const fincaId = route.params.id
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`http://localhost:3000/api/fincas/${fincaId}/tareas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ tareas: tareas.value })
    })
    if (!res.ok) throw new Error()
    alert('✅ Tareas guardadas')
    await fetchTareas()
  } catch (e) {
    console.error(e)
    alert('❌ Error al guardar tareas')
  }
}

const fetchTareas = async () => {
  const fincaId = route.params.id
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`http://localhost:3000/api/fincas/${fincaId}/tareas`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    tareas.value = data.tareas || []
  } catch (e) {
    console.error('Error al obtener tareas:', e)
  }
}

const usuarioActual = ref(null)
const fetchUsuarioActual = async () => {
  const token = localStorage.getItem('token')
  if (!token) return

  try {
    const res = await fetch('http://localhost:3000/api/usuarios/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (!res.ok) throw new Error('Error al obtener usuario')
    usuarioActual.value = await res.json()
  } catch (error) {
    console.error('Error al obtener usuario actual:', error)
  }
}
const gastos = ref([])
const nuevoGasto = ref({ descripcion: '', cantidad: 0 })

const fetchGastos = async () => {
  const fincaId = route.params.id
  const token = localStorage.getItem('token') // ⚠️ Asegúrate de haber guardado el token al iniciar sesión

  try {
    const res = await fetch(`http://localhost:3000/api/gastos/${fincaId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!res.ok) throw new Error('Error al obtener gastos')

    const data = await res.json()
    gastos.value = data || []
  } catch (e) {
    console.error('Error al obtener gastos:', e)
  }
}



const agregarGasto = async () => {
  const fincaId = route.params.id
  const { descripcion, cantidad } = nuevoGasto.value
  const token = localStorage.getItem('token')

  if (!descripcion || cantidad <= 0) return alert('Datos del gasto inválidos')

  try {
    const res = await fetch('http://localhost:3000/api/gastos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ finca_id: fincaId, descripcion, cantidad })
    })

    if (!res.ok) throw new Error('Error al agregar gasto')

    alert('✅ Gasto registrado')
    nuevoGasto.value = { descripcion: '', cantidad: 0 }
    await fetchGastos()
    await actualizarDineroGastado()

  } catch (e) {
    console.error(e)
    alert('❌ No se pudo registrar el gasto')
  }
}



const actualizarDineroGastado = async () => {
  finca.value.dinero_gastado = gastos.value.reduce((total, g) => total + Number(g.cantidad), 0)
  calcularProgreso()
}

import { computed } from 'vue'

const totalGastos = computed(() =>
  gastos.value.reduce((total, gasto) => total + (parseFloat(gasto.cantidad) || 0), 0)
)

const progresoGananciaReal = computed(() => {
  const ganado = finca.value.dinero_ganado || 0
  const gastado = finca.value.dinero_gastado || 0
  const objetivo = finca.value.objetivo_ingresos || 0

  const gananciaNeta = ganado - gastado
  if (objetivo === 0) return 0

  return Math.max(0, Math.min(100, (gananciaNeta / objetivo) * 100))
})

const barraColor = computed(() => {
  return finca.value.dinero_gastado > finca.value.dinero_ganado
    ? 'bg-danger' // rojo si hay pérdida
    : 'bg-success' // verde si va bien
})
const ingresos = ref([])
const nuevoIngreso = ref({ descripcion: '', cantidad: 0 })

const agregarIngreso = async () => {
  const fincaId = route.params.id
  const { descripcion, cantidad } = nuevoIngreso.value
  const token = localStorage.getItem('token')

  if (!descripcion || cantidad <= 0) return alert('Datos de ingreso inválidos')

  try {
    const res = await fetch('http://localhost:3000/api/fincas/' + fincaId + '/ingresos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ finca_id: fincaId, descripcion, cantidad })
    })

    if (!res.ok) throw new Error('Error al agregar ingreso')

    alert('✅ Ingreso registrado')

    nuevoIngreso.value = { descripcion: '', cantidad: 0 }

    await fetchIngresos() // sobrescribe el array con lo que hay realmente en DB
    await actualizarDineroGanado();

  } catch (e) {
    console.error(e)
    alert('❌ No se pudo registrar el ingreso')
  }
}




const guardarIngresos = async () => {
  const fincaId = route.params.id;
  const token = localStorage.getItem('token');

  try {
    // Solo guardar ingresos que no tengan ID (es decir, nuevos)
    const nuevos = ingresos.value.filter(i => !i.id);

    for (const ingreso of nuevos) {
      if (!ingreso.descripcion || !ingreso.cantidad) continue;

      const res = await fetch(`http://localhost:3000/api/fincas/${fincaId}/ingresos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          finca_id: fincaId,
          descripcion: ingreso.descripcion,
          cantidad: ingreso.cantidad
        })
      });

      if (!res.ok) throw new Error('Error guardando ingreso');
    }

    alert('✅ Nuevos ingresos guardados correctamente');
    await fetchIngresos(); // Refresca para obtener IDs reales

  } catch (e) {
    console.error(e);
    alert('❌ Error al guardar ingresos');
  }
};


const fetchIngresos = async () => {
  const fincaId = route.params.id
  const token = localStorage.getItem('token')

  try {
    const res = await fetch(`http://localhost:3000/api/ingresos/${fincaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = await res.json()
    ingresos.value = data || []
    await actualizarDineroGanado(); // ⬅️ Aquí
  } catch (e) {
    console.error('Error al obtener ingresos:', e)
  }
}

const producciones = ref([])
const nuevaProduccion = ref({
  fecha_inicio: '',
  fecha_fin: '',
  tipo: '',
  cantidad: null,
  descripcion: '',
})
const modoEdicion = ref(false)
const produccionEditandoId = ref(null)

const fetchProducciones = async () => {
  const fincaId = route.params.id
  const token = localStorage.getItem('token')
  const res = await fetch(`http://localhost:3000/api/fincas/${fincaId}/producciones`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  producciones.value = data.producciones || []
}

const agregarProduccion = async () => {
  const fincaId = route.params.id
  const token = localStorage.getItem('token')
  const body = { ...nuevaProduccion.value, finca_id: fincaId }

  const res = await fetch(`http://localhost:3000/api/fincas/${fincaId}/producciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })

  if (!res.ok) return alert('❌ Error al guardar')
  await fetchProducciones()
  nuevaProduccion.value = { fecha_inicio: '', fecha_fin: '', tipo: '', cantidad: null, descripcion: '' }
}

const editarProduccion = (index) => {
  const p = producciones.value[index]
  produccionEditandoId.value = p.id
  nuevaProduccion.value = { ...p }
  modoEdicion.value = true
}

const actualizarProduccion = async () => {
  const fincaId = route.params.id
  const token = localStorage.getItem('token')
  const id = produccionEditandoId.value

  const res = await fetch(`http://localhost:3000/api/fincas/${fincaId}/producciones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(nuevaProduccion.value),
  })

  if (!res.ok) return alert('❌ Error al actualizar')

  await fetchProducciones()
  modoEdicion.value = false
  produccionEditandoId.value = null
  nuevaProduccion.value = { fecha_inicio: '', fecha_fin: '', tipo: '', cantidad: null, descripcion: '' }
}

const eliminarProduccion = async (id) => {
  const fincaId = route.params.id
  const token = localStorage.getItem('token')

  const res = await fetch(`http://localhost:3000/api/fincas/${fincaId}/producciones/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return alert('❌ Error al eliminar')
  await fetchProducciones()
}

const rendimientoProducciones = ref([])

const fetchRendimientoProducciones = async () => {
  const fincaId = route.params.id
  const token = localStorage.getItem('token')

  try {
    const res = await fetch(`http://localhost:3000/api/fincas/${fincaId}/rendimiento-producciones`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    rendimientoProducciones.value = data.producciones || []
  } catch (error) {
    console.error('❌ Error al obtener rendimiento:', error)
  }
}

onMounted(async () => {
  await fetchFinca()
  await fetchTrabajadores()
  await fetchCalendario()
  await fetchTareas()
  await fetchGastos()
  await fetchUsuarioActual()
  await actualizarDineroGastado()
  await fetchIngresos()
  await fetchProducciones()
  await fetchRendimientoProducciones()
})


const actualizarDineroGanado = async () => {
  finca.value.dinero_ganado = ingresos.value.reduce((total, ingreso) => total + Number(ingreso.cantidad || 0), 0);
  calcularProgreso();
};

const formatearFecha = (fecha) => {
  if (!fecha) return ''
  const d = new Date(fecha)
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>
