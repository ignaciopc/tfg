<template>
  <section class="register-container">
    <!-- Formulario de registro -->
    <article class="form-box">
      <h2>Inicio de Sesión</h2>
      <form @submit.prevent="handleSubmit">
        <!-- Campo de correo electrónico -->
        <article class="input-group">
          <label for="email">Correo electrónico</label>
          <input type="email" id="email" v-model="form.email" placeholder="Ingresa tu correo electrónico" required />
        </article>

        <!-- Campo de contraseña -->
        <article class="input-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" v-model="form.password" placeholder="Ingresa tu contraseña" required />
        </article>

        <!-- Botón de login -->
        <button type="submit" class="submit-btn">Iniciar Sesión</button>
      </form>

      <!-- Enlace a la página de registro -->
      <p class="login-link">
        ¿No tienes una cuenta? <a href="/register">Regístrate</a>
      </p>
    </article>
  </section>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      form: {
        email: '',
        password: ''
      },
      errorMessage: ''
    };
  },
  methods: {
    async handleSubmit() {
      this.errorMessage = ''; // Limpiar mensaje de error

      try {
        const response = await axios.post('http://localhost:3000/api/login', this.form);

        // Si la respuesta es exitosa, se guarda el token
        const token = response.data.token;
        localStorage.setItem('token', token);

        // Redirigir al usuario a la página /home
        this.$router.push('/home');
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || 'Credenciales incorrectas.';
        } else {
          this.errorMessage = 'Error de conexión.';
        }
      }
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
  background-color: #f4f1eb;
}

.form-box {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #3e7c2d;
  font-size: 24px;
  margin-bottom: 20px;
}

.input-group {
  margin-bottom: 20px;
}

input {
  width: 90%;
  padding: 10px;
  margin-top: 5px;
  border: 1px solid #6fbf73;
  border-radius: 4px;
  background-color: #ffffff;
  font-size: 16px;
  color: #404040;
}

input:focus {
  border-color: #3e7c2d;
  outline: none;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #3e7c2d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-btn:hover {
  background-color: #6fbf73;
}

.login-link {
  text-align: center;
  margin-top: 10px;
  font-size: 14px;
}

.login-link a {
  color: #a4c7e0;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
