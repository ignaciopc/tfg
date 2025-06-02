// src/main.js
import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faTree } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import axios from './axios'; // Usamos nuestra configuración personalizada de Axios

const app = createApp(App);

// Agregar Axios globalmente a la app
app.config.globalProperties.$axios = axios;

library.add(faTree);
app.component('font-awesome-icon', FontAwesomeIcon);

app.use(router);
app.mount('#app');
