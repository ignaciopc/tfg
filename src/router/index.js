import { createRouter, createWebHistory } from 'vue-router'
import Register from '../views/Register.vue'
import Session from '../views/Session.vue'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/register',
    name: 'Register',  // Cambié 'register' por 'Register' (solo la primera letra mayúscula)
    component: Register
  },
  {
    path: '/Session',
    name: 'Session',  // 'Session' ya estaba con la primera letra mayúscula
    component: Session
  },
  {
    path: '/Home',
    name: 'Home',  // 'Session' ya estaba con la primera letra mayúscula
    component: Home
  },
  // Ruta por defecto, redirige a /register
  {
    path: '/',
    redirect: '/register'
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
