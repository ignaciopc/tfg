<template>
  <div class="grafica-wrapper">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script>
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
  name: 'ResumenGrafica',
  components: { Bar },
  props: {
    resumen: {
      type: Array,
      required: true,
    },
  },
  computed: {
    chartData() {
      return {
        labels: this.resumen.map(f => f.finca_nombre),
        datasets: [
          {
            label: 'Dinero Ganado',
            backgroundColor: '#4CAF50',
            data: this.resumen.map(f => f.dinero_ganado ?? 0),
          },
          {
            label: 'Dinero Gastado',
            backgroundColor: '#F44336',
            data: this.resumen.map(f => f.total_gastos ?? 0),
          },
        ],
      }
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              autoSkip: false,
              maxRotation: 45,
              minRotation: 30,
              font: {
                size: 12,
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: value =>
                new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(value),
              font: {
                size: 12,
              },
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 12,
              },
            },
          },
          title: {
            display: true,
            text: 'Dinero Ganado vs Gastado por Finca',
            font: {
              size: 16,
            },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const value = context.parsed.y ?? 0
                return `${context.dataset.label}: ` +
                  new Intl.NumberFormat('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(value)
              },
            },
          },
        },
      }
    },
  },
}
</script>

<style scoped>
.grafica-wrapper {
  height: 400px;
  width: 100%;
  position: relative;
}

/* Para pantallas pequeñas */
@media (max-width: 576px) {
  .grafica-wrapper {
    height: 300px;
  }
}
</style>
