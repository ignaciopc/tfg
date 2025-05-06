<template>
    <div>
      <canvas ref="lineChart"></canvas>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import {
    Chart,
    LineElement,
    PointElement,
    LineController,
    CategoryScale,
    LinearScale,
    Legend,
    Tooltip,
    Filler
  } from 'chart.js'
  
  Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Legend, Tooltip, Filler)
  
  const lineChart = ref(null)
  
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio']
  const ganancias = [500, 600, 900, 800, 400, 1000, 700]
  const perdidas = [-200, -300, -100, -400, -500, -200, -100]
  
  onMounted(() => {
    new Chart(lineChart.value, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Ganancias',
            data: ganancias,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Pérdidas',
            data: perdidas,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            min: -1000, // Establecer mínimo en -1000
            max: 1000, // Establecer máximo en 1000
            ticks: {
              stepSize: 100, // Aseguramos que las divisiones sean de 100 en 100
              callback: function(value) {
                return value + ' €'; // Añadimos el símbolo de euro a los valores
              }
            },
            title: {
              display: true,
              text: 'Balance (€)'
            },
            grid: {
              drawOnChartArea: true,
              drawTicks: true,
            }
          },
          x: {
            title: {
              display: true,
              text: 'Meses'
            }
          }
        }
      }
    })
  })
  </script>
  