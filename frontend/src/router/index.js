import { createRouter, createWebHistory } from 'vue-router'
import Register from '../views/register.vue'
import Session from '../views/Session.vue'
import Home from '../views/Home.vue'
import CrearFinca from '../views/CrearFinca.vue'
import ListarFincas from '../views/ListarFincas.vue'
import MapaInteractivo from '../views/MapaInteractivo.vue';
import ListaTareas from '../views/ListaTareas.vue'; 
import GestionRoles from '../views/GestionRoles.vue'; 
import CalendarioTareas from '../views/CalendarioTareas.vue'; 
import ResumenFinanzas from '../views/ResumenFinanzas.vue'; 
import ListaUsuarios from '../views/ListaUsuarios.vue'; 
import GenerarDocumento from '../views/GenerarDocumento.vue'; 
import ConfiguracionCuenta from '../views/ConfiguracionCuenta.vue'; 
import RendimientoFincas from '../views/RendimientoFincas.vue'; 

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
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/fincas/crear',
    name: 'CrearFinca',
    component: CrearFinca,
    meta: { requiresAuth: true }
  },
  {
    path: '/fincas/lista',
    name: 'ListarFincas',
    component: ListarFincas,
    meta: { requiresAuth: true }
  },
  {
    path: '/fincas/detalles/:id',
    name: 'DetallesFinca',
    component: () => import('../views/DetallesFincas.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/fincas/mapa',
    name: 'MapaInteractivo',
    component: MapaInteractivo,
    meta: { requiresAuth: true }
  },
  {
    path: '/tareas/lista',
    name: 'ListaTareas',
    component: ListaTareas,
    meta: { requiresAuth: true }
  },
  {
    path: '/usuarios/roles',
    name: 'GestionRoles',
    component: GestionRoles,
    meta: { requiresAuth: true }
  },
  {
    path: '/tareas/calendario',
    name: 'CalendarioTareas',
    component: CalendarioTareas,
    meta: { requiresAuth: true }
  },
  {
    path: '/finanzas/resumen',
    name: 'ResumenFinanzas',
    component: ResumenFinanzas,
    meta: { requiresAuth: true }
  },
  {
    path: '/usuarios/lista',
    name: 'ListaUsuarios',
    component: ListaUsuarios,
    meta: { requiresAuth: true }
  },
  {
    path: '/documentos/generar',
    name: 'GenerarDocumento',
    component: GenerarDocumento,
    meta: { requiresAuth: true }
  },
  {
    path: '/cuenta',
    name: 'ConfiguracionCuenta',
    component: ConfiguracionCuenta,
    meta: { requiresAuth: true }
  },
  {
    path: '/fincas/rendimiento',
    name: 'RendimientoFincas',
    component: RendimientoFincas,
    meta: { requiresAuth: true }
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

// Guardia global para rutas protegidas
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next({ name: 'Session' }) // redirige a login si no hay token
  } else {
    next()
  }
})

export default router
