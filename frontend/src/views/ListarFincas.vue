<template>
  <div class="listar-fincas container">
    <h2>Hola, estas son tus fincas:</h2>

    <!-- 📱 Vista para móviles (tarjetas) -->
    <div class="fincas-responsive">
      <div class="finca-card" v-for="finca in fincas" :key="finca.id">
        <p><strong>ID:</strong> {{ finca.id }}</p>
        <p><strong>Nombre:</strong> {{ finca.nombre }}</p>
        <p><strong>Tamaño:</strong> {{ finca.tamano }}</p>
        <p><strong>Tipo Cultivo:</strong> {{ finca.tipo_cultivo }}</p>
        <p><strong>Usuario ID:</strong> {{ finca.usuario_id }}</p>
        <p><strong>Fecha:</strong> {{ formatFecha(finca.fecha_creacion) }}</p>
        <p><strong>Municipio:</strong> {{ finca.municipio || 'N/D' }}</p>
        <div class="acciones">
          <button v-if="rol !== 'trabajador'" @click="eliminarFinca(finca.id)">Eliminar</button>
          <router-link :to="`/fincas/detalles/${finca.id}`">Examinar</router-link>
        </div>
      </div>
    </div>

    <!-- 🖥️ Vista para escritorio (tabla) -->
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Tamaño</th>
          <th>Tipo Cultivo</th>
          <th>Usuario ID</th>
          <th>Fecha Creación</th>
          <th>Ubicación</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="finca in fincas" :key="finca.id">
          <td>{{ finca.id }}</td>
          <td>{{ finca.nombre }}</td>
          <td>{{ finca.tamano }}</td>
          <td>{{ finca.tipo_cultivo }}</td>
          <td>{{ finca.usuario_id }}</td>
          <td>{{ formatFecha(finca.fecha_creacion) }}</td>
          <td>{{ finca.municipio || 'N/D' }}</td>
          <td>
            <button v-if="rol !== 'trabajador'" @click="eliminarFinca(finca.id)">Eliminar</button>
            <router-link :to="`/fincas/detalles/${finca.id}`">Examinar</router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      fincas: [],
      rol: null
    }
  },
  methods: {
    formatFecha(fecha) {
      if (!fecha) return 'N/D'
      const date = new Date(fecha)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    async eliminarFinca(id) {
      if (!confirm('¿Estás seguro de que deseas eliminar esta finca?')) return

      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:3000/api/fincas/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.fincas = this.fincas.filter(f => f.id !== id)
        alert('Finca eliminada con éxito.')
      } catch (error) {
        console.error('Error al eliminar finca:', error.response?.data || error.message)
        alert('No se pudo eliminar la finca.')
      }
    }
  },
  async mounted() {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get('http://localhost:3000/api/fincas/lista', {
        headers: { Authorization: `Bearer ${token}` }
      })
      this.fincas = response.data.fincas

      const userResponse = await axios.get('http://localhost:3000/api/usuarios/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      this.rol = userResponse.data.rol
    } catch (error) {
      console.error('Error al obtener datos:', error.response?.data || error.message)
    }
  }
}
</script>

<style scoped>
.listar-fincas {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
}

/* Estilos tabla (escritorio) */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #ccc;
  padding: 10px;
  text-align: center;
}

/* Botones */
button {
  cursor: pointer;
  background-color: #e74c3c;
  border: none;
  padding: 6px 10px;
  color: white;
  border-radius: 4px;
  margin-right: 5px;
}

button:hover {
  background-color: #c0392b;
}

a {
  color: #3498db;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Vista móvil (tarjetas) */
.fincas-responsive {
  display: none;
}

.finca-card {
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
}

.finca-card p {
  margin: 5px 0;
}

.acciones {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  table {
    display: none;
  }

  .fincas-responsive {
    display: block;
  }
}
</style>
