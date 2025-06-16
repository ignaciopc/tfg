<template>
  <footer class="bg-light text-center text-muted py-4 border-top mt-auto">
    <div class="container">
      <!-- Logotipo -->
      <img src="/icon-192.png" alt="Logotipo olivo" width="40" height="40" class="mb-2" />

      <!-- Texto -->
      <p class="mb-1">© 2025 Ignacio Palomar Chacón</p>
      <p class="mb-2 small">
        Aplicación web para la gestión integral de fincas olivareras.
      </p>

      <!-- Enlaces -->
      <div class="d-flex justify-content-center gap-3 small">
        <a href="mailto:ignaciopalomarchacon@gmail.com" class="text-muted text-decoration-none">Contacto</a>
        <a href="https://github.com/ignaciopc" target="_blank" class="text-muted text-decoration-none">GitHub</a>
      </div>
    </div>
  </footer>
</template>

<script setup>
// No hay lógica necesaria por ahora
</script>

<style scoped>
footer img {
  filter: grayscale(100%) opacity(70%);
}
</style>
