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
              <li><router-link to="/fincas/detalles" class="dropdown-item">Detalles de la Finca</router-link></li>
              <li><router-link to="/fincas/informe-financiero" class="dropdown-item">Informe Financiero</router-link></li>
              <li><router-link to="/fincas/tareas" class="dropdown-item">Tareas Programadas</router-link></li>
              <li><router-link to="/fincas/historial" class="dropdown-item">Historial de Rendimiento</router-link></li>
              <li><router-link to="/fincas/crear" class="dropdown-item">Agregar Nueva Finca</router-link></li>
            </ul>
          </li>

          <!-- Tareas -->
          <li class="nav-item dropdown" v-if="isAuthenticated">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Tareas y Proyectos</a>
            <ul class="dropdown-menu">
              <li><router-link to="/tareas/lista" class="dropdown-item">Lista de Tareas</router-link></li>
              <li><router-link to="/tareas/calendario" class="dropdown-item">Calendario de Actividades</router-link></li>
              <li><router-link to="/tareas/proyectos" class="dropdown-item">Proyectos de Mejora</router-link></li>
            </ul>
          </li>

          <!-- Finanzas -->
          <li class="nav-item dropdown" v-if="isAuthenticated">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Finanzas</a>
            <ul class="dropdown-menu">
              <li><router-link to="/finanzas/resumen" class="dropdown-item">Resumen de Finanzas</router-link></li>
              <li><router-link to="/finanzas/rentabilidad" class="dropdown-item">Informe de Rentabilidad</router-link></li>
              <li><router-link to="/finanzas/pagos" class="dropdown-item">Control de Pagos y Facturación</router-link></li>
              <li><router-link to="/finanzas/inventario" class="dropdown-item">Inventario</router-link></li>
            </ul>
          </li>

          <!-- Usuarios -->
          <li class="nav-item dropdown" v-if="isAuthenticated">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Usuarios y Roles</a>
            <ul class="dropdown-menu">
              <li><router-link to="/usuarios/lista" class="dropdown-item">Lista de Usuarios</router-link></li>
              <li><router-link to="/usuarios/roles" class="dropdown-item">Gestión de Roles y Permisos</router-link></li>
              <li><router-link to="/usuarios/accesos" class="dropdown-item">Control de Accesos</router-link></li>
            </ul>
          </li>

          <!-- Documentos -->
          <li class="nav-item dropdown" v-if="isAuthenticated">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Documentos</a>
            <ul class="dropdown-menu">
              <li><router-link to="/documentos/gestion" class="dropdown-item">Gestión de Documentos</router-link></li>
              <li><router-link to="/documentos/vencimientos" class="dropdown-item">Control de Vencimientos</router-link></li>
            </ul>
          </li>

          <!-- Configuración -->
          <li class="nav-item dropdown" v-if="isAuthenticated">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Configuración</a>
            <ul class="dropdown-menu">
              <li><router-link to="/configuracion/cuenta" class="dropdown-item">Ajustes de la Cuenta</router-link></li>
              <li><router-link to="/configuracion/plataforma" class="dropdown-item">Configuración de la Plataforma</router-link></li>
              <li><router-link to="/configuracion/integraciones" class="dropdown-item">Integraciones Externas</router-link></li>
            </ul>
          </li>

          <!-- Reportes -->
          <li class="nav-item dropdown" v-if="isAuthenticated">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Reportes</a>
            <ul class="dropdown-menu">
              <li><router-link to="/reportes/generacion" class="dropdown-item">Generación de Reportes</router-link></li>
              <li><router-link to="/reportes/exportacion" class="dropdown-item">Exportación de Datos</router-link></li>
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

<script>
export default {
  name: 'Header',
  data() {
    return {
      isAuthenticated: false
    };
  },
  created() {
    this.checkAuthentication();
  },
  methods: {
    checkAuthentication() {
      const token = localStorage.getItem('token');
      this.isAuthenticated = !!token;
    }
  }
};
</script>
