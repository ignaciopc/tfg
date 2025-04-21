
<template>
  <div id="app">
    <Header />
    <router-view></router-view> 
  </div>
</template>

<script>
import Header from './components/Header.vue';  // Asegúrate de importar el componente

export default {
  name: 'App',
  components: {
    Header  // Agregar el componente Header al layout principal
  }
};
</script>

<style>
/* Aquí puedes agregar estilos globales si lo deseas */
</style>