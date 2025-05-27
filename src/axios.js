// src/axios.js
import axios from 'axios';

// Configuración base de Axios
const instance = axios.create({
  baseURL: 'http://localhost:3000/api',  // Dirección base del servidor (asegúrate de que esté corriendo)
  timeout: 10000, // Tiempo máximo de espera (en ms)
  headers: {
    'Content-Type': 'application/json',  // Indicamos que los datos enviados son en formato JSON
  },
});

// Puedes añadir un interceptor si necesitas manejar de manera global los errores o la autenticación
instance.interceptors.response.use(
  response => response,  // Si la respuesta es correcta, simplemente la retorna
  error => {
    if (error.response && error.response.status === 401) {
      // Manejar errores de autenticación, como redirigir al login
      console.error('No autorizado', error);
    }
    return Promise.reject(error);  // Si hay un error, lo retorna
  }
);

export default instance;
