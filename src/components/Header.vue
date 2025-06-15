<template>
  <header class="navbar navbar-expand-lg navbar-dark bg-success px-4 py-3 rounded shadow mx-auto mt-3" style="width: 80%;">
    <div class="container-fluid">
      <router-link class="navbar-brand fw-bold" to="/home" v-if="isAuthenticated">Inicio</router-link>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse justify-content-center" id="navbarNavDropdown">
        <ul class="navbar-nav gap-2">

          <!-- Fincas -->
          <li class="nav-item dropdown" v-if="isAuthenticated">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Fincas</a>
            <ul class="dropdown-menu">
              <li><router-link to="/fincas/lista" class="dropdown-item">Lista de Fincas</router-link></li>
              <li><router-link to="/fincas/mapa" class="dropdown-item">Mapa Interactivo</router-link></li>
              <li><router-link to="/fincas/historial" class="dropdown-item">Historial de Rendimiento</router-link></li>
              <li v-if="usuarioActual?.rol !== 'trabajador'"><router-link to="/fincas/crear" class="dropdown-item">Agregar Nueva Finca</router-link></li>
            </ul>
          </li>

          <!-- Tareas -->
          <li class="nav-item dropdown" v-if="isAuthenticated">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Tareas y Proyectos</a>
            <ul class="dropdown-menu">
              <li><router-link to="/tareas/lista" class="dropdown-item">Lista de Tareas</router-link></li>
              <li><router-link to="/tareas/calendario" class="dropdown-item">Calendario de Actividades</router-link></li>
            </ul>
          </li>

          <!-- Finanzas -->
          <li class="nav-item dropdown" v-if="isAuthenticated && usuarioActual?.rol !== 'trabajador'">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Finanzas</a>
            <ul class="dropdown-menu">
              <li><router-link to="/finanzas/resumen" class="dropdown-item">Resumen de Finanzas</router-link></li>
              <li v-if="usuarioActual?.rol !== 'trabajador'"><router-link to="/finanzas/informe-financiero" class="dropdown-item">Informe Financiero</router-link></li>

            </ul>
          </li>

          <!-- Usuarios -->
          <li class="nav-item dropdown" v-if="isAuthenticated && usuarioActual?.rol !== 'trabajador'">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Usuarios y Roles</a>
            <ul class="dropdown-menu">
              <li><router-link to="/usuarios/lista" class="dropdown-item">Lista de Usuarios</router-link></li>
              <li><router-link to="/usuarios/roles" class="dropdown-item">Creacion de trabajadores</router-link></li>
            </ul>
          </li>

          <!-- Documentos -->
          <li class="nav-item dropdown" v-if="isAuthenticated" >
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Documentos</a>
            <ul class="dropdown-menu">
              <li><router-link to="/documentos/generar" class="dropdown-item">Gestión de Documentos</router-link></li>
              <li><router-link to="/documentos/vencimientos" class="dropdown-item">Control de Vencimientos</router-link></li>
            </ul>
          </li>

        
          <!-- Cuenta -->
          <li class="nav-item" v-if="isAuthenticated">
            <router-link to="/account" class="nav-link">Cuenta</router-link>
          </li>

        </ul>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isAuthenticated = ref(false)
const usuarioActual = ref(null)

function checkAuthentication() {
  const token = localStorage.getItem('token')
  isAuthenticated.value = !!token
}

async function fetchUsuarioActual() {
  const token = localStorage.getItem('token')
  if (!token) return

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
  }
}

onMounted(async () => {
  checkAuthentication()
  if (isAuthenticated.value) {
    await fetchUsuarioActual()
  }
})
</script>
