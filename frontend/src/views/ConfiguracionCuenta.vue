<template>
  <div class="container my-5" style="max-width: 600px;">
    <h2 class="mb-4 text-center text-success">Configurar Mi Cuenta</h2>

    <form @submit.prevent="actualizarCuenta" class="border p-4 rounded shadow-sm bg-white">
      
      <div class="mb-3">
        <label for="nombre" class="form-label fw-semibold">Nombre</label>
        <input
          id="nombre"
          v-model="usuario.nombre"
          type="text"
          class="form-control"
          required
          placeholder="Tu nombre completo"
        />
      </div>

      <div class="mb-3">
        <label for="correo" class="form-label fw-semibold">Correo</label>
        <input
          id="correo"
          v-model="usuario.correo"
          type="email"
          class="form-control"
          required
          placeholder="tuemail@ejemplo.com"
        />
      </div>

      <div class="mb-3">
        <label for="telefono" class="form-label fw-semibold">Teléfono</label>
        <input
          id="telefono"
          v-model="usuario.telefono"
          type="tel"
          class="form-control"
          placeholder="Ej. +34 600 123 456"
        />
      </div>

      <div class="mb-3">
        <label for="password" class="form-label fw-semibold">Nueva contraseña <small class="text-muted">(dejar vacío para no cambiar)</small></label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="form-control"
          placeholder="Nueva contraseña"
        />
      </div>

      <div class="mb-3">
        <label for="confirmPassword" class="form-label fw-semibold">Confirmar contraseña</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          class="form-control"
          placeholder="Repite la nueva contraseña"
        />
      </div>

      <button type="submit" class="btn btn-success w-100 fw-semibold">Guardar cambios</button>
    </form>

    <button @click="cerrarSesion" class="btn btn-outline-danger w-100 mt-3">Cerrar sesión</button>

    <div v-if="mensaje" 
         :class="{'alert alert-success mt-3': mensaje === 'Cuenta actualizada con éxito.', 'alert alert-danger mt-3': mensaje !== 'Cuenta actualizada con éxito.' }" 
         role="alert">
      {{ mensaje }}
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const usuario = ref({ nombre: '', correo: '', telefono: '' })
const password = ref('')
const confirmPassword = ref('')
const mensaje = ref('')

// ✅ Usamos la URL del backend desde .env
const API_URL = import.meta.env.VITE_API_URL

async function cargarDatos() {
  const token = localStorage.getItem('token')
  if (!token) return

  try {
    const res = await fetch(`${API_URL}/api/usuarios/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('Error al obtener usuario')
    const data = await res.json()
    usuario.value = {
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono || ''
    }
  } catch (error) {
    console.error(error)
  }
}

async function actualizarCuenta() {
  mensaje.value = ''
  if (password.value !== confirmPassword.value) {
    mensaje.value = 'Las contraseñas no coinciden.'
    return
  }

  const token = localStorage.getItem('token')
  if (!token) {
    mensaje.value = 'No autenticado.'
    return
  }

  const payload = {
    nombre: usuario.value.nombre,
    correo: usuario.value.correo,
    telefono: usuario.value.telefono
  }

  if (password.value) {
    payload.contraseña = password.value
  }

  try {
    const res = await fetch(`${API_URL}/api/usuarios/guardar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.message || 'Error al actualizar datos')
    }

    mensaje.value = 'Cuenta actualizada con éxito.'
    password.value = ''
    confirmPassword.value = ''
  } catch (error) {
    mensaje.value = error.message
  }
}

function cerrarSesion() {
  localStorage.removeItem('token')
  router.push('/session')
}

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
body {
  background-color: #f8f9fa;
}
</style>
