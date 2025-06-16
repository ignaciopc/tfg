<template>
  <div class="register-container">
    <!-- Formulario de registro -->
    <div class="form-box">
      <h2>Registro de Usuario</h2>
      <form @submit.prevent="handleSubmit">
        <!-- Campo de nombre de usuario -->
        <div class="input-group">
          <label for="username">Nombre de usuario</label>
          <input type="text" id="username" v-model="form.username" placeholder="Ingresa tu nombre de usuario" required />
        </div>

        <!-- Campo de correo electrónico -->
        <div class="input-group">
          <label for="email">Correo electrónico</label>
          <input type="email" id="email" v-model="form.email" placeholder="Ingresa tu correo electrónico" required />
        </div>
        <!-- Campo de teléfono -->
        <div class="input-group">
          <label for="telefono">Teléfono</label>
          <input type="tel" id="telefono" v-model="form.telefono" placeholder="Ingresa tu número de teléfono" required />
        </div>

        <!-- Campo de contraseña -->
        <div class="input-group">
          <label for="password">Contraseña</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            placeholder="Crea una contraseña"
            required
          />
          <ul v-if="form.password.length > 0" class="password-error-list">
            <li v-for="(error, index) in passwordErrors" :key="index">
              ⚠️ {{ error }}
            </li>
            <li v-if="passwordErrors.length === 0" class="valid-message">✔️ Contraseña segura</li>
          </ul>
        </div>

        <!-- Campo de confirmación de contraseña -->
        <div class="input-group">
          <label for="confirmPassword">Confirmar contraseña</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="form.confirmPassword"
            placeholder="Confirma tu contraseña"
            required
          />
        </div>

        <!-- Botón de registro -->
        <button type="submit" class="submit-btn">Registrarse</button>
      </form>

      <!-- Mensajes de error o éxito -->
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

      <!-- Enlace a la página de login -->
      <p class="login-link">
        ¿Ya tienes una cuenta? <router-link to="/session">Iniciar sesión</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // fallback para desarrollo

export default {
  data() {
    return {
      form: {
        username: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: ''
      },
      errorMessage: '',
      successMessage: '',
      passwordErrors: []
    };
  },
  watch: {
    'form.password'(newVal) {
      this.passwordErrors = this.validarPassword(newVal);
    }
  },
  methods: {
    validarPassword(password) {
      const errores = [];

      if (password.length < 8) errores.push('mínimo 8 caracteres');
      if (!/[A-Z]/.test(password)) errores.push('al menos una letra mayúscula');
      if (!/[a-z]/.test(password)) errores.push('al menos una letra minúscula');
      if (!/\d/.test(password)) errores.push('al menos un número');
      if (!/[@$!%*?&]/.test(password)) errores.push('al menos un símbolo (@$!%*?&)');

      return errores;
    },

    async handleSubmit() {
      this.errorMessage = '';
      this.successMessage = '';

      if (this.passwordErrors.length > 0) {
        this.errorMessage = 'La contraseña no cumple con los requisitos.';
        return;
      }

      if (this.form.password !== this.form.confirmPassword) {
        this.errorMessage = 'Las contraseñas no coinciden.';
        return;
      }

      try {
        // Registro
        const response = await axios.post(
          `${baseURL}/api/register`,
          this.form,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            withCredentials: true
          }
        );

        this.successMessage = response.data.message;

        // Login automático justo después
        const loginResponse = await axios.post(
          `${baseURL}/api/login`,
          {
            email: this.form.email,
            password: this.form.password
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            withCredentials: true
          }
        );

        // Guardar token y redirigir
        const token = loginResponse.data.token;
        localStorage.setItem('token', token);

        this.$router.push('/home'); // O a la ruta que quieras
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || 'Error en el servidor';
        } else {
          this.errorMessage = 'Error de conexión';
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
  /* Gris claro de fondo */
}

.form-box {
  background-color: #ffffff;
  /* Caja de formulario blanca */
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  /* Sombra sutil */
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #3e7c2d;
  /* Verde oliva para el título */
  font-size: 24px;
  margin-bottom: 20px;
}

.input-group {
  margin-bottom: 20px;
}

.label {
  font-weight: bold;
  color: #404040;
  /* Gris oscuro para etiquetas */
}

input {
  width: 90%;
  padding: 10px;
  margin-top: 5px;
  border: 1px solid #6fbf73;
  /* Verde oliva claro para los bordes */
  border-radius: 4px;
  background-color: #ffffff;
  font-size: 16px;
  color: #404040;
}

input:focus {
  border-color: #3e7c2d;
  /* Verde oliva al enfocar */
  outline: none;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #3e7c2d;
  /* Verde oliva para el botón */
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-btn:hover {
  background-color: #6fbf73;
  /* Verde más claro al pasar el ratón */
}

.login-link {
  text-align: center;
  margin-top: 10px;
  font-size: 14px;
}

.login-link a {
  color: #a4c7e0;
  /* Azul suave para el enlace */
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

.error-message {
  color: red;
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
}

.success-message {
  color: green;
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
}

.password-error-list {
  margin-top: 6px;
  padding-left: 20px;
  color: #d9534f; /* rojo */
  font-size: 13px;
}

.password-error-list li.valid-message {
  color: #5cb85c; /* verde */
}
</style>
