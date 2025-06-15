<template>
  <div class="container py-4 resumen-container">
    <h2 class="mb-4 text-center">Resumen de Gastos por Finca</h2>

    <div v-if="loading" class="text-center">Cargando resumen...</div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else>
      <!-- Gráfica -->
      <ResumenGrafica :resumen="resumen" />

      <!-- Tabla -->
      <div class="table-responsive mt-4">
        <table class="table table-bordered table-striped resumen-table">
          <thead>
            <tr>
              <th>Finca</th>
              <th>Dinero Gastado</th>
              <th>Dinero Ganado</th>
              <th>Beneficio</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="finca in resumen" :key="finca.finca_id">
              <td data-label="Finca">{{ finca.finca_nombre }}</td>
              <td data-label="Dinero Gastado">{{ formatCurrency(finca.total_gastos ?? 0) }}</td>
              <td data-label="Dinero Ganado">{{ formatCurrency(finca.dinero_ganado ?? 0) }}</td>
              <td data-label="Beneficio">
                {{ formatCurrency((finca.dinero_ganado ?? 0) - (finca.total_gastos ?? 0)) }}
              </td>
              <td data-label="Detalles">
                <router-link
                  :to="`/fincas/detalles/${finca.finca_id}`"
                  class="btn btn-primary btn-sm"
                  target="_blank"
                >
                  Saber más
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
    }
  },
  mounted() {
    this.cargarResumen()
  },
}
</script>

<style>
.resumen-container {
  padding-left: 10px;
  padding-right: 10px;
}

/* Tabla por defecto en escritorio */
.table-responsive {
  overflow-x: auto;
}

/* Responsive: estilo tipo lista para móviles */
@media (max-width: 768px) {
  .resumen-table thead {
    display: none;
  }

  .resumen-table,
  .resumen-table tbody,
  .resumen-table tr,
  .resumen-table td {
    display: block;
    width: 100%;
  }

  .resumen-table tr {
    margin-bottom: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 10px;
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  .resumen-table td {
    padding: 8px 10px;
    text-align: left;
    position: relative;
  }

  .resumen-table td::before {
    content: attr(data-label);
    font-weight: bold;
    display: block;
    margin-bottom: 4px;
    color: #495057;
  }

  /* 🔽 Oculta solo el label "Detalles" en móviles */
  .resumen-table td[data-label="Detalles"]::before {
    display: none;
  }

  .btn-sm {
    font-size: 13px;
    padding: 6px 10px;
    width: 100%;
    margin-top: 6px;
  }
}

</style>
