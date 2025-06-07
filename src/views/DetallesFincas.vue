<template>
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-lg-10">

                <!-- 🔖 Datos básicos -->
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white fw-bold">
                        🔖 Datos básicos
                    </div>
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
                    <div class="card-header bg-success text-white fw-bold">
                        💰 Sección Económica
                    </div>
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

                        <button @click="guardarCambios" class="btn btn-sm btn-primary">💾 Guardar todos los
                            cambios</button>

                        <p class="mt-3"><strong>Ganancia estimada:</strong> ${{ finca.dinero_ganado -
                            finca.dinero_gastado }}</p>

                        <div class="mt-3">
                            <label class="form-label">📊 Progreso económico:</label>
                            <div class="progress">
                                <div class="progress-bar bg-success" role="progressbar"
                                    :style="{ width: progresoGanancia + '%' }" :aria-valuenow="progresoGanancia"
                                    aria-valuemin="0" aria-valuemax="100">
                                    {{ progresoGanancia.toFixed(1) }}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 👨‍🌾 Personal -->
                <div class="card mb-4">
                    <div class="card-header bg-info text-white fw-bold">
                        👨‍🌾 Personal
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Trabajadores:</label>
                            <input v-model.number="finca.trabajadores" type="number" class="form-control" />
                            <button @click="guardarCambios" class="btn btn-sm btn-primary">💾 Guardar todos los
                                cambios</button>

                        </div>
                    </div>
                </div>

                <!-- 🗓️ Calendario de cultivo -->
                <div class="card mb-4">
                    <div class="card-header bg-warning text-dark fw-bold">
                        🗓️ Calendario de cultivo
                    </div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item"><strong>Preparación del terreno:</strong> 01 Mar - 15 Mar</li>
                            <li class="list-group-item"><strong>Siembra:</strong> 15 Mar - 01 Abr</li>
                            <li class="list-group-item"><strong>Mantenimiento:</strong> Abril - Julio</li>
                            <li class="list-group-item"><strong>Cosecha:</strong> 01 Ago - 15 Sep</li>
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

const fetchFinca = async () => {
    const id = route.params.id
    if (!id) {
        console.error('❌ No se especificó ID de finca.')
        return
    }

    const token = localStorage.getItem('token')
    if (!token) {
        console.error('❌ No hay token disponible en localStorage.')
        return
    }

    const res = await fetch(`http://localhost:3000/api/fincas/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!res.ok) {
        console.error(`❌ Error al obtener finca: ${res.statusText}`)
        return
    }

    const data = await res.json()
    finca.value = data
    calcularProgreso()
}

const calcularProgreso = () => {
    const meta = finca.value.objetivo_ingresos || 0
    const ganado = finca.value.dinero_ganado || 0
    progresoGanancia.value = meta > 0 ? (ganado / meta) * 100 : 0
}

const guardarCambios = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
        alert('⚠️ No se encontró token para autenticar.')
        return
    }

    const res = await fetch(`http://localhost:3000/api/fincas/${finca.value.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            objetivo_ingresos: finca.value.objetivo_ingresos,
            dinero_gastado: finca.value.dinero_gastado,
            dinero_ganado: finca.value.dinero_ganado,
            trabajadores: finca.value.trabajadores
        })
    })

    if (res.ok) {
        alert('✅ Cambios guardados correctamente')
        calcularProgreso()
    } else {
        alert('❌ Error al guardar cambios')
    }
}

onMounted(fetchFinca)
</script>
