import { createRouter, createWebHistory } from 'vue-router'
import Register from '../views/register.vue'
import Session from '../views/Session.vue'
import Home from '../views/Home.vue'
import CrearFinca from '../views/CrearFinca.vue'
import ListarFincas from '../views/ListarFincas.vue'
import MapaInteractivo from '../views/MapaInteractivo.vue';

const routes = [
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/session',
    name: 'Session',
    component: Session
  },
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/fincas/crear',         // 👈 Nueva ruta agregada aquí
    name: 'CrearFinca',
    component: CrearFinca
  },
  {
    path: '/fincas/lista',   // ruta para listar fincas
    name: 'ListarFincas',
    component: ListarFincas
  },
  {
    path: '/fincas/mapa',
    name: 'MapaInteractivo',
    component: MapaInteractivo
  },
  {
    path: '/',
    redirect: '/register'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
