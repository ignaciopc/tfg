<template>
  <header class="navbar">
    <nav class="nav-container">
      <!-- Mostrar "Inicio" solo si el usuario está autenticado -->

      <!-- Menú desplegable para "Fincas" -->
      <div v-if="isAuthenticated" class="dropdown">
        <button class="dropbtn">Fincas</button>
        <div class="dropdown-content">
          <router-link to="/fincas/lista" class="nav-link">Lista de Fincas</router-link>
          <router-link to="/fincas/mapa" class="nav-link">Mapa Interactivo</router-link>
          <router-link to="/fincas/detalles" class="nav-link">Detalles de la Finca</router-link>
          <router-link to="/fincas/informe-financiero" class="nav-link">Informe Financiero</router-link>
          <router-link to="/fincas/tareas" class="nav-link">Tareas Programadas</router-link>
          <router-link to="/fincas/historial" class="nav-link">Historial de Rendimiento</router-link>
          <router-link to="/fincas/crear" class="nav-link">Agregar Nueva Finca</router-link>

        </div>
      </div>

      <!-- Menú desplegable para "Tareas y Proyectos" -->
      <div v-if="isAuthenticated" class="dropdown">
        <button class="dropbtn">Tareas y Proyectos</button>
        <div class="dropdown-content">
          <router-link to="/tareas/lista" class="nav-link">Lista de Tareas</router-link>
          <router-link to="/tareas/calendario" class="nav-link">Calendario de Actividades</router-link>
          <router-link to="/tareas/proyectos" class="nav-link">Proyectos de Mejora</router-link>
        </div>
      </div>

      <!-- Menú desplegable para "Finanzas" -->
      <div v-if="isAuthenticated" class="dropdown">
        <button class="dropbtn">Finanzas</button>
        <div class="dropdown-content">
          <router-link to="/finanzas/resumen" class="nav-link">Resumen de Finanzas</router-link>
          <router-link to="/finanzas/rentabilidad" class="nav-link">Informe de Rentabilidad</router-link>
          <router-link to="/finanzas/pagos" class="nav-link">Control de Pagos y Facturación</router-link>
          <router-link to="/finanzas/inventario" class="nav-link">Inventario</router-link>
        </div>
      </div>

      <!-- Menú desplegable para "Usuarios y Roles" -->
      <div v-if="isAuthenticated" class="dropdown">
        <button class="dropbtn">Usuarios y Roles</button>
        <div class="dropdown-content">
          <router-link to="/usuarios/lista" class="nav-link">Lista de Usuarios</router-link>
          <router-link to="/usuarios/roles" class="nav-link">Gestión de Roles y Permisos</router-link>
          <router-link to="/usuarios/accesos" class="nav-link">Control de Accesos</router-link>
        </div>
      </div>

      <router-link v-if="isAuthenticated" to="/home" class="nav-link dropbtn">Inicio</router-link>

      <!-- Menú desplegable para "Documentos" -->
      <div v-if="isAuthenticated" class="dropdown">
        <button class="dropbtn">Documentos</button>
        <div class="dropdown-content">
          <router-link to="/documentos/gestion" class="nav-link">Gestión de Documentos</router-link>
          <router-link to="/documentos/vencimientos" class="nav-link">Control de Vencimientos</router-link>
        </div>
      </div>

      <!-- Menú desplegable para "Configuración" -->
      <div v-if="isAuthenticated" class="dropdown">
        <button class="dropbtn">Configuración</button>
        <div class="dropdown-content">
          <router-link to="/configuracion/cuenta" class="nav-link">Ajustes de la Cuenta</router-link>
          <router-link to="/configuracion/plataforma" class="nav-link">Configuración de la Plataforma</router-link>
          <router-link to="/configuracion/integraciones" class="nav-link">Integraciones Externas</router-link>
        </div>
      </div>

      <!-- Menú desplegable para "Reportes" -->
      <div v-if="isAuthenticated" class="dropdown">
        <button class="dropbtn">Reportes</button>
        <div class="dropdown-content">
          <router-link to="/reportes/generacion" class="nav-link">Generación de Reportes</router-link>
          <router-link to="/reportes/exportacion" class="nav-link">Exportación de Datos</router-link>
        </div>
      </div>

      <!-- Mostrar "Cuenta" solo si el usuario está autenticado -->
      <router-link v-if="isAuthenticated" to="/account" class="nav-link dropbtn">Cuenta</router-link>
    </nav>
  </header>
</template>

<script>
export default {
  name: 'Header',
  data() {
    return {
      isAuthenticated: false, // Inicialmente no autenticado
    };
  },
  created() {
    this.checkAuthentication(); // Comprobamos la autenticación al cargar el componente
  },
  methods: {
    // Método para verificar si el usuario está autenticado
    checkAuthentication() {
      const token = localStorage.getItem('token'); // Obtenemos el token de localStorage
      this.isAuthenticated = !!token; // Si el token existe, el usuario está autenticado
    },
  },
};
</script>

<style scoped>
.navbar {
  margin: auto;
  background-color: #3e7c2d;
  /* Verde oliva para el fondo */
  padding: 15px 40px;
  /* Ajusta el padding para más espacio en los lados */
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  top: 20px;
  left: 20px;
  right: 20px;
  width: 80%;
  z-index: 1000;
  border-radius: 10px;
}

.nav-container {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-size: 18px;
  font-weight: bold;
}

.nav-link:hover {
  text-decoration: underline;
}

/* Estilos para el menú desplegable */
.dropdown {
  position: relative;
  display: inline-block;
}

.dropbtn {
  background-color: #4CAF50;
  /* Color más vibrante */
  color: white;
  padding: 12px 18px;
  font-size: 18px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  /* Borde redondeado para el botón */
  transition: background-color 0.3s ease;
  /* Transición suave */
}

.dropbtn:hover {
  background-color: #45a049;
  /* Color al pasar el cursor */
}

.dropdown-content {
  display: none;
  position: absolute;
  background-color: #fff;
  min-width: 160px;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 1;
  border-radius: 5px;
  /* Bordes redondeados para el contenido */
  opacity: 0;
  transition: opacity 0.3s ease;
  /* Transición suave de aparición */
}

.dropdown:hover .dropdown-content {
  display: block;
  opacity: 1;
  /* Hace visible el menú */
}

.dropdown-content .nav-link {
  color: #333;
  /* Color oscuro para los enlaces */
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  font-size: 16px;
  /* Ajusta el tamaño de la fuente para mejorar la legibilidad */
  transition: background-color 0.3s ease;
  /* Transición suave */
}

.dropdown-content .nav-link:hover {
  background-color: #f1f1f1;
  /* Color de fondo al pasar el cursor */
}

.nav-link:active {
  color: #2e7d32;
  /* Color cuando se hace clic en un enlace */
}
</style>
