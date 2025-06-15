// src/axios.js
import axios from 'axios';
import router from './router'; // Importamos el router para redirección

// Configuración base de Axios
const instance = axios.create({
  baseURL: 'http://localhost:3000/api',  // Dirección base del servidor
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de respuestas para manejar errores de autenticación
instance.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message;

    if (
      error.response?.status === 401 &&
      (message === 'jwt expired' || message === 'TokenExpiredError')
    ) {
      console.warn('Token expirado. Redirigiendo al login...');

      // Eliminar token
      localStorage.removeItem('token');

      // Redirigir al login
      router.push('/session');

      // También puedes mostrar una alerta si quieres
      alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
    }

    return Promise.reject(error);
  }
);

export default instance;
