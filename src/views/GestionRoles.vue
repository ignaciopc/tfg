<template>
  <div class="register-container">
    <div class="form-box">
      <h2>Registrar Trabajador</h2>
      <form @submit.prevent="handleSubmit">
        <div class="input-group">
          <label for="username">Nombre</label>
          <input type="text" id="username" v-model="form.username" required />
        </div>

        <div class="input-group">
          <label for="email">Correo</label>
          <input type="email" id="email" v-model="form.email" required />
        </div>

        <div class="input-group">
          <label for="telefono">Teléfono</label>
          <input type="tel" id="telefono" v-model="form.telefono" required />
        </div>

        <div class="input-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" v-model="form.password" required />
        </div>

        <div class="input-group">
          <label for="confirmPassword">Confirmar Contraseña</label>
          <input type="password" id="confirmPassword" v-model="form.confirmPassword" required />
        </div>

        <button type="submit" class="submit-btn">Registrar Trabajador</button>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

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
      successMessage: ''
    };
  },
  methods: {
    async handleSubmit() {
      this.errorMessage = '';
      this.successMessage = '';

      if (this.form.password !== this.form.confirmPassword) {
        this.errorMessage = 'Las contraseñas no coinciden.';
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        this.errorMessage = 'No hay token de sesión. Inicia sesión primero.';
        return;
      }

      try {
        const response = await axios.post(
          'http://localhost:3000/api/register-trabajador',
          {
            username: this.form.username,
            email: this.form.email,
            telefono: this.form.telefono,
            password: this.form.password
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        this.successMessage = response.data.message;
        this.form = {
          username: '',
          email: '',
          telefono: '',
          password: '',
          confirmPassword: ''
        };
      } catch (error) {
        this.errorMessage =
          error.response?.data?.message || 'Error al registrar trabajador.';
      }
    }
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f4f1eb;
}

.form-box {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #3e7c2d;
}

.input-group {
  margin-bottom: 15px;
}

label {
  display: block;
  color: #333;
  font-weight: bold;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #6fbf73;
  border-radius: 4px;
}

button.submit-btn {
  width: 100%;
  padding: 10px;
  background-color: #3e7c2d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

button.submit-btn:hover {
  background-color: #6fbf73;
}

.error-message {
  color: red;
  margin-top: 10px;
  text-align: center;
}

.success-message {
  color: green;
  margin-top: 10px;
  text-align: center;
}
</style>
