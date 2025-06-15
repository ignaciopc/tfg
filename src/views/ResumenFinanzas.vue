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
                            <td>
                                <router-link :to="`/fincas/detalles/${finca.finca_id}`" class="btn btn-primary"
                                    target="_blank">
                                    Saber más
                                </router-link>
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
        ResumenGrafica,
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
        async toggleDetalle(id) {
            if (this.detalleVisible === id) {
                this.detalleVisible = null
                return
            }
            this.detalleVisible = id

            const finca = this.resumen.find(f => f.finca_id === id)
            if (!finca.gastos || !finca.trabajadores || !finca.municipio) {
                try {
                    const token = localStorage.getItem('token')

                    // Obtener gastos detallados
                    const gastosRes = await axios.get(`/api/gastos/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    finca.gastos = gastosRes.data

                    // Obtener trabajadores
                    const trabajadoresRes = await axios.get(`/api/fincas/${id}/trabajadores`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    finca.trabajadores = trabajadoresRes.data.trabajadores

                    // Obtener detalle finca con municipio
                    const fincaRes = await axios.get(`/api/fincas/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    finca.municipio = fincaRes.data.municipio

                } catch (error) {
                    console.error('Error cargando detalles:', error)
                }
            }
        }
    },
    mounted() {
        this.cargarResumen()
    },
}
</script>
