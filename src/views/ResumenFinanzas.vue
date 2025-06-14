<template>
    <div class="container py-4">
        <h2 class="mb-4 text-center">Resumen de Gastos por Finca</h2>

        <div v-if="loading" class="text-center">Cargando resumen...</div>
        <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
        <div v-else>
            <!-- Aquí incluyes la gráfica -->
            <ResumenGrafica :resumen="resumen" />

            <table class="table table-bordered table-striped mt-4">
                <thead>
                    <tr>
                        <th>Finca</th>
                        <th>Total Gastos</th>
                        <th>Dinero Ganado</th>
                        <th>Beneficio</th> <!-- Nueva columna -->
                        <th>Detalles</th>
                    </tr>
                </thead>

                <tbody>
                    <template v-for="finca in resumen" :key="finca.finca_id">
                        <tr>
                            <td>{{ finca.finca_nombre }}</td>
                            <td>{{ formatCurrency(finca.total_gastos ?? 0) }}</td>
                            <td>{{ formatCurrency(finca.dinero_ganado ?? 0) }}</td>
                            <td>{{ formatCurrency((finca.dinero_ganado ?? 0) - (finca.total_gastos ?? 0)) }}</td>
                            <!-- Beneficio -->
                            <td>
                                <button @click="toggleDetalle(finca.finca_id)">
                                    {{ detalleVisible === finca.finca_id ? 'Ocultar' : 'Mostrar' }}
                                </button>
                            </td>
                        </tr>

                        <!-- fila detalle permanece igual -->
                        <tr v-if="detalleVisible === finca.finca_id">
                            <td colspan="5">
                                <p><strong>Ubicación:</strong> {{ finca.municipio }}</p>
                                <p><strong>Tamaño:</strong> {{ finca.tamano }} ha</p>
                                <p><strong>Tipo de cultivo:</strong> {{ finca.tipo_cultivo }}</p>
                                <p><strong>Beneficio:</strong> {{ formatCurrency((finca.dinero_ganado ?? 0) -
                                    (finca.total_gastos ?? 0)) }}</p>

                                <h5>Gastos Detallados:</h5>
                                <ul v-if="finca.gastos">
                                    <li v-for="gasto in finca.gastos" :key="gasto.id">
                                        {{ gasto.descripcion }} - {{ formatCurrency(gasto.cantidad) }}
                                    </li>
                                </ul>

                                <h5>Trabajadores:</h5>
                                <ul v-if="finca.trabajadores">
                                    <li v-for="trabajador in finca.trabajadores" :key="trabajador.id">
                                        {{ trabajador.nombre }} — {{ formatCurrency(trabajador.sueldo) }}
                                    </li>
                                </ul>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>

        </div>
    </div>
</template>

<script>
import axios from 'axios'
import ResumenGrafica from '../components/ResumenGrafica.vue'

export default {
    components: {
        ResumenGrafica,  // <-- Regístralo aquí
    },
    data() {
        return {
            resumen: [],
            loading: false,
            error: null,
            detalleVisible: null,
        }
    },
    methods: {
        async cargarResumen() {
            this.loading = true
            this.error = null
            try {
                const token = localStorage.getItem('token')
                const response = await axios.get('/api/gastos/resumen', {
                    headers: { Authorization: `Bearer ${token}` },
                })

                console.log('Respuesta resumen:', response.data.resumen)
                this.resumen = response.data.resumen || []
            } catch (err) {
                this.error = 'Error cargando el resumen de gastos.'
                console.error(err)
            } finally {
                this.loading = false
            }
        },
        formatCurrency(valor) {
            if (valor === null || valor === undefined) return '-'
            return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
            }).format(valor)
        },
        toggleDetalle(id) {
            this.detalleVisible = this.detalleVisible === id ? null : id
        },
    },
    mounted() {
        this.cargarResumen()
    },
}
</script>
