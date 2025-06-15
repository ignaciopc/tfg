<template>
  <div class="register-background">
    <div class="register-container mt-4">
      <div class="form-box">
        <h2>Registrar Trabajador</h2>
        <form @submit.prevent="handleSubmit">
          <div class="input-group">
            <label for="username">Nombre</label>
            <input type="text" id="username" v-model="form.username" required placeholder="Ingresa el nombre completo" />
          </div>

          <div class="input-group">
            <label for="email">Correo</label>
            <input type="email" id="email" v-model="form.email" required placeholder="ejemplo@correo.com" />
          </div>

          <div class="input-group">
            <label for="telefono">Teléfono</label>
            <input type="tel" id="telefono" v-model="form.telefono" required placeholder="+34 600 123 456" />
          </div>

          <div class="input-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" v-model="form.password" required placeholder="Mínimo 6 caracteres" />
          </div>

          <div class="input-group">
            <label for="confirmPassword">Confirmar Contraseña</label>
            <input type="password" id="confirmPassword" v-model="form.confirmPassword" required placeholder="Repite la contraseña" />
          </div>

          <button type="submit" class="submit-btn">Registrar Trabajador</button>

          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
          <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
        </form>
      </div>
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
        this.errorMessage = error.response?.data?.message || 'Error al registrar trabajador.';
      }
    }
  }
};
</script>

<style scoped>
/* Fondo general que envuelve el formulario */
.register-background {
  background-color: #f4f1eb;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.register-container {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 500px;
}

/* Formulario blanco */
.form-box {
  background-color: #ffffff;
  padding: 25px;
  border-radius: 10px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #3e7c2d;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.input-group {
  margin-bottom: 16px;
}

label {
  display: block;
  color: #333;
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 14px;
}

input {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #6fbf73;
  border-radius: 4px;
}

button.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #3e7c2d;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  margin-top: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button.submit-btn:hover {
  background-color: #5aa152;
}

.error-message,
.success-message {
  text-align: center;
  margin-top: 12px;
  font-size: 14px;
}

.error-message {
  color: #d9534f;
}

.success-message {
  color: #28a745;
}

/* Responsive ajustes */
@media (max-width: 480px) {
  .form-box {
    padding: 20px 15px;
  }

  h2 {
    font-size: 1.3rem;
  }

  input {
    font-size: 13px;
    padding: 9px;
  }

  label {
    font-size: 13px;
  }

  button.submit-btn {
    font-size: 14px;
    padding: 10px;
  }

  .error-message,
  .success-message {
    font-size: 13px;
  }
}
</style>
