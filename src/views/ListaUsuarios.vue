<template>
  <div class="container py-4">
    <h2 class="mb-4 text-center">Lista Trabajadores</h2>

    <div v-if="loading" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else>
      <div v-if="subordinados.length" class="row row-cols-1 row-cols-md-2 g-4">
        <div v-for="user in subordinados" :key="user.id" class="col">
          <div class="card h-100 shadow-sm">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">{{ user.nombre }}</h5>
              <h6 class="card-subtitle mb-2 text-muted">{{ user.rol }}</h6>
              <p class="card-text mb-1"><strong>Correo:</strong> {{ user.correo }}</p>
              <p class="card-text mb-1"><strong>Teléfono:</strong> {{ user.telefono ?? '-' }}</p>
              <p class="card-text">
                <strong>Activo:</strong>
                <span :class="user.activo ? 'text-success' : 'text-danger'">
                  {{ user.activo ? 'Sí' : 'No' }}
                </span>
              </p>
              <div class="mt-auto text-end">
                <button 
                  class="btn btn-danger btn-sm"
                  @click="confirmarEliminar(user.id, user.nombre)"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-else class="text-center fs-5 mt-4">No tienes usuarios subordinados.</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      subordinados: [],
      loading: false,
      error: null,
    }
  },
  methods: {
    async cargarSubordinados() {
      this.loading = true
      this.error = null
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/api/usuarios/subordinados', {
          headers: { Authorization: `Bearer ${token}` },
        })
        this.subordinados = response.data.subordinados || []
      } catch (err) {
        this.error = 'Error cargando usuarios subordinados.'
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    async eliminarUsuario(id) {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`/api/usuarios/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        this.subordinados = this.subordinados.filter(u => u.id !== id)
      } catch (err) {
        alert('Error eliminando usuario.')
        console.error(err)
      }
    },
    confirmarEliminar(id, nombre) {
      if (confirm(`¿Seguro que quieres eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) {
        this.eliminarUsuario(id)
      }
    },
  },
  mounted() {
    this.cargarSubordinados()
  },
}
</script>

<style scoped>
.card {
  min-height: 180px;
}
</style>
