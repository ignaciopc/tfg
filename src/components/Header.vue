<template>
    <header class="navbar">
      <nav class="nav-container">
        <router-link to="/register" class="nav-link">Registro</router-link>
        <font-awesome-icon :icon="['fas', 'tree']"style="color: white;" /> 

        <router-link to="/session" class="nav-link">Iniciar sesión</router-link>
        <router-link to="/home" class="nav-link">Inicio</router-link>
      </nav>
    </header>
  </template>
  
  <script>
  export default {
    name: 'Header'
  };
  </script>
  
  <style scoped>
  .navbar {
    margin: auto;
    background-color: #3e7c2d; /* Verde oliva para el fondo */
    padding: 15px 40px;  /* Ajusta el padding para más espacio en los lados */
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    position: fixed; /* Fijamos el header en la parte superior */
    top: 20px; /* Separado de la parte superior (ajusta a tu gusto) */
    left: 20px; /* Separado de los lados (ajusta a tu gusto) */
    right: 20px; /* Separado del lado derecho */
    width: 80%; /* Ancho con el margen de los lados */
    z-index: 1000; /* Asegura que el header esté encima de otros elementos */
    border-radius: 10px; /* Opcional, para bordes redondeados */
  }
  
  .nav-container {
    display: flex;
    justify-content: center;
    gap: 20px; /* Espacio entre los enlaces */
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
  </style>
  