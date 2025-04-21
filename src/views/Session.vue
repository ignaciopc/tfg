<template>
    <section class="register-container">
      <!-- Formulario de registro -->
      <article class="form-box">
        <h2>Inicio de Sesion</h2>
        <form @submit.prevent="handleSubmit">
          <!-- Campo de correo electrónico -->
          <article class="input-group">
            <label for="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              v-model="form.email"
              placeholder="Ingresa tu correo electrónico"
              required
            />
          </article>
  
          <!-- Campo de contraseña -->
          <article class="input-group">
            <label for="password">Contraseña</label>
            <input
              type="password"
              id="password"
              v-model="form.password"
              placeholder="Crea una contraseña"
              required
            />
          </article>
  
          <!-- Campo de confirmación de contraseña -->
        
          <!-- Botón de registro -->
          <button type="submit" class="submit-btn">Inicia Sesion</button>
        </form>
  
        <!-- Enlace a la página de login -->
        <p class="login-link">
          ¿No tienes una cuenta? <a href="/login">Registrate</a>
        </p>
      </article>
    </section>
  </template>
  
  <script>
  export default {
    data() {
      return {
        form: {
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        }
      };
    },
    methods: {
      handleSubmit() {
       
        console.log('Formulario enviado', this.form);
      }
    }
  };
  </script>
  
  <style scoped>
  /* Estilos generales */
  .register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f4f1eb; /* Gris claro de fondo */
  }
  
  .form-box {
    background-color: #ffffff; /* Caja de formulario blanca */
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); /* Sombra sutil */
    width: 100%;
    max-width: 400px;
  }
  
  h2 {
    text-align: center;
    color: #3e7c2d; /* Verde oliva para el título */
    font-size: 24px;
    margin-bottom: 20px;
  }
  
  .input-group {
    margin-bottom: 20px;
  }
  
  .label {
    font-weight: bold;
    color: #404040; /* Gris oscuro para etiquetas */
  }
  
  input {
    width: 90%;
    padding: 10px;
    margin-top: 5px;
    border: 1px solid #6fbf73; /* Verde oliva claro para los bordes */
    border-radius: 4px;
    background-color: #ffffff;
    font-size: 16px;
    color: #404040;
  }
  
  input:focus {
    border-color: #3e7c2d; /* Verde oliva al enfocar */
    outline: none;
  }
  
  .submit-btn {
    width: 100%;
    padding: 12px;
    background-color: #3e7c2d; /* Verde oliva para el botón */
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .submit-btn:hover {
    background-color: #6fbf73; /* Verde más claro al pasar el ratón */
  }
  
  .login-link {
    text-align: center;
    margin-top: 10px;
    font-size: 14px;
  }
  
  .login-link a {
    color: #a4c7e0; /* Azul suave para el enlace */
    text-decoration: none;
  }
  
  .login-link a:hover {
    text-decoration: underline;
  }
  </style>
  