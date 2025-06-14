<template>
  <div>
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
          y: {
            beginAtZero: true,
            ticks: {
              // Formato moneda en eje Y
              callback: value => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value),
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Dinero Ganado vs Gastado por Finca',
            font: { size: 18 },
          },
          tooltip: {
            callbacks: {
              label: context => {
                const value = context.parsed.y ?? 0
                return context.dataset.label + ': ' + new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
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
div {
  height: 400px;
}
</style>
