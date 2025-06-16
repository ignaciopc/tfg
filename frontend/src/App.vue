<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <Header />
    <router-view />
    <Footer />
  </div>
</template>

<script>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'  

export default {
  name: 'App',
  components: {
    Header,
    Footer  // ✅ Añadir el componente aquí también
  }
}
</script>

<style>
/* Estilos globales opcionales */
</style>
