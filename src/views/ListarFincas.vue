<template>
  <div class="listar-fincas">
    <h2>Hola, estas son tus fincas:</h2>
    <table border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Tamaño</th>
          <th>Tipo Cultivo</th>
          <th>Usuario ID</th>
          <th>Fecha Creación</th>
          <th>Ubicación (Municipio)</th>
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
          <td><button @click="eliminarFinca(finca.id)">Eliminar</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      fincas: []
    };
  },
  methods: {
    formatFecha(fecha) {
      if (!fecha) return 'N/D';
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    async eliminarFinca(id) {
      if (!confirm('¿Estás seguro de que deseas eliminar esta finca?')) return;

      try {
        const token = localStorage.getItem('token');

        await axios.delete(`http://localhost:3000/api/fincas/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        this.fincas = this.fincas.filter(f => f.id !== id);
        alert('Finca eliminada con éxito.');
      } catch (error) {
        console.error('Error al eliminar finca:', error.response?.data || error.message);
        alert('No se pudo eliminar la finca.');
      }
    }
  },
  async mounted() {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get('http://localhost:3000/api/fincas/lista', {
        headers: { Authorization: `Bearer ${token}` }
      });

      this.fincas = response.data.fincas;
    } catch (error) {
      console.error('Error al obtener fincas:', error.response?.data || error.message);
    }
  }
};
</script>

<style scoped>
.listar-fincas {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
</style>
