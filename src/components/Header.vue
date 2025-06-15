<template>
  <header class="navbar navbar-expand-lg navbar-dark bg-success px-4 py-3 rounded shadow mx-auto mt-3" style="width: 80%;">
    <div class="container-fluid">
      <template v-if="isAuthenticated">
        <router-link class="navbar-brand fw-bold" to="/home">Inicio</router-link>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse justify-content-center" id="navbarNavDropdown">
          <ul class="navbar-nav gap-2">
            <!-- Todo tu menú para usuarios autenticados aquí -->
            <!-- Fincas -->
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Fincas</a>
              <ul class="dropdown-menu">
                <li><router-link to="/fincas/lista" class="dropdown-item">Lista de Fincas</router-link></li>
                <li><router-link to="/fincas/mapa" class="dropdown-item">Mapa Interactivo</router-link></li>
                <li v-if="usuarioActual?.rol !== 'trabajador'"><router-link to="/fincas/crear" class="dropdown-item">Agregar Nueva Finca</router-link></li>
                <li v-if="usuarioActual?.rol !== 'trabajador'"><router-link to="/fincas/rendimiento" class="dropdown-item">Rendimiento</router-link></li>
              </ul>
            </li>

            <!-- Tareas -->
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Tareas y Proyectos</a>
              <ul class="dropdown-menu">
                <li><router-link to="/tareas/lista" class="dropdown-item">Lista de Tareas</router-link></li>
                <li><router-link to="/tareas/calendario" class="dropdown-item">Calendario de Actividades</router-link></li>
              </ul>
            </li>

            <!-- Finanzas -->
            <li class="nav-item dropdown" v-if="usuarioActual?.rol !== 'trabajador'">
              <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Finanzas</a>
              <ul class="dropdown-menu">
                <li><router-link to="/finanzas/resumen" class="dropdown-item">Resumen de Finanzas</router-link></li>
                <li v-if="usuarioActual?.rol !== 'trabajador'"><router-link to="/finanzas/informe-financiero" class="dropdown-item">Informe Financiero</router-link></li>
              </ul>
            </li>

            <!-- Usuarios -->
            <li class="nav-item dropdown" v-if="usuarioActual?.rol !== 'trabajador'">
              <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Usuarios y Roles</a>
              <ul class="dropdown-menu">
                <li><router-link to="/usuarios/lista" class="dropdown-item">Lista de Usuarios</router-link></li>
                <li><router-link to="/usuarios/roles" class="dropdown-item">Creacion de trabajadores</router-link></li>
              </ul>
            </li>

            <!-- Documentos -->
            <li v-if="usuarioActual?.rol !== 'trabajador'" class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Documentos</a>
              <ul class="dropdown-menu">
                <li><router-link to="/documentos/generar" class="dropdown-item">Gestión de Documentos</router-link></li>
                <li><router-link to="/documentos/vencimientos" class="dropdown-item">Control de Vencimientos</router-link></li>
              </ul>
            </li>

            <!-- Cuenta -->
            <li class="nav-item">
              <router-link to="/cuenta" class="nav-link">Cuenta</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/home" class="nav-link">Inicio</router-link>
            </li>
          </ul>
        </div>
      </template>

      <template v-else>
        <!-- Solo mostrar link a /session cuando NO está autenticado -->
        <router-link class="navbar-brand fw-bold" to="/session">Iniciar Sesión</router-link>
      </template>
    </div>
  </header>
</template>


<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const isAuthenticated = ref(false)
const usuarioActual = ref(null)
const route = useRoute()

function checkAuthentication() {
  const token = localStorage.getItem('token')
  isAuthenticated.value = !!token
}

async function fetchUsuarioActual() {
  const token = localStorage.getItem('token')
  if (!token) {
    usuarioActual.value = null
    return
  }

  try {
    const res = await fetch('http://localhost:3000/api/usuarios/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (!res.ok) throw new Error('Error al obtener usuario')
    usuarioActual.value = await res.json()
  } catch (error) {
    console.error('Error al obtener usuario actual:', error)
    usuarioActual.value = null
  }
}

async function actualizarHeader() {
  checkAuthentication()
  if (isAuthenticated.value) {
    await fetchUsuarioActual()
  } else {
    usuarioActual.value = null
  }
}

// Carga inicial al montar el componente
onMounted(() => {
  actualizarHeader()
})

// Observa el cambio de ruta para actualizar el header
watch(route, () => {
  actualizarHeader()
})
</script>