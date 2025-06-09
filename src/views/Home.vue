<template>
  <div class="dashboard container">
    <div class="row"> 
      <div class="card">Total de fincas</div>
      <div class="card">Producción esperada</div>
      <div class="card">Tareas pendientes</div>
    </div>

    <div class="row">
      <div class="card large">
        <p>Reparto de gastos</p>

        <EarningsChart />
      </div>
      <div class="card large"></div>
    </div>

    <div class="row">
      <div class="card small">Ver detalles</div>
      <div class="card large">Lista de tareas pendientes</div>
    </div>

    <div class="button-row">
      <button>+ Ver mapa</button>
      <button>Registrar gasto</button>
      <button>Ver tareas</button>
      <button>Generar informe</button>
    </div>
  </div>
</template>
<script setup>
import EarningsChart from '../components/EarningsChart.vue'
</script>

  
  <style scoped>
  .dashboard {
    padding: 20px;
    font-family: sans-serif;
    margin-top: 5%;
  }
  
  .title {
    font-size: 24px;
    margin-bottom: 20px;
  }
  
  .row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .card {
    background-color: #f4f4f4;
    padding: 20px;
    border-radius: 8px;
    flex: 1;
    min-height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .card.large {
    flex: 2;
    flex-direction: column;
  }
  
  .card.small {
    flex: 0.5;
  }
  
  .graph-placeholder {
    width: 100%;
    height: 80px;
    background-color: #dcdcdc;
    margin-bottom: 10px;
    border-radius: 4px;
  }
  
  .map-placeholder {
    background-image: repeating-linear-gradient(
      45deg,
      #ccc,
      #ccc 10px,
      #eaeaea 10px,
      #eaeaea 20px
    );
    height: 130px;
  }
  
  .button-row {
    display: flex;
    gap: 10px;
  }
  
  button {
    padding: 10px 15px;
    border: none;
    background-color: #3498db;
    color: white;
    border-radius: 5px;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #2980b9;
  }
  </style>
  