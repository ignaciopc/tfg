<template>
  <div class="chart-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend, Title)

const props = defineProps({
  ganado: Number,
  gastado: Number
})

const canvasRef = ref(null)
let chartInstance = null

const renderChart = () => {
  if (chartInstance) chartInstance.destroy()

  chartInstance = new Chart(canvasRef.value, {
    type: 'doughnut',
    data: {
      labels: ['Ganado', 'Gastado'],
      datasets: [
        {
          data: [props.ganado, props.gastado],
          backgroundColor: ['#4CAF50', '#F44336']
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: false }
      }
    }
  })
}

onMounted(renderChart)
watch(() => [props.ganado, props.gastado], renderChart)
</script>

<style scoped>
.chart-container {
  width: 250px;
  height: 250px;
  margin: 0 auto;
}
</style>
