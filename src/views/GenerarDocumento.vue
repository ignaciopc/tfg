<template>
  <div class="listar-fincas">
    <h2>Hola, estas son tus fincas:</h2>

    <button @click="descargarPDFTodas" class="btn-todas" :disabled="fincas.length === 0">
      Descargar PDF con TODAS las fincas
    </button>

    <div class="table-wrapper">
      <table>
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
            <td data-label="ID">{{ finca.id }}</td>
            <td data-label="Nombre">{{ finca.nombre }}</td>
            <td data-label="Tamaño">{{ finca.tamano }}</td>
            <td data-label="Tipo Cultivo">{{ finca.tipo_cultivo }}</td>
            <td data-label="Usuario ID">{{ finca.usuario_id }}</td>
            <td data-label="Fecha Creación">{{ formatFecha(finca.fecha_creacion) }}</td>
            <td data-label="Municipio">{{ finca.municipio || 'N/D' }}</td>
            <td data-label="Acciones">
              <button @click="descargarPDF(finca.id)">Generar documento</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      fincas: [],
    };
  },
  methods: {
    formatFecha(fecha) {
      if (!fecha) return 'N/D';
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },
    async fetchFincas() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/fincas/lista', {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.fincas = response.data.fincas;
      } catch (error) {
        console.error('Error al obtener fincas:', error.response?.data || error.message);
        alert('No se pudo cargar la lista de fincas');
      }
    },
    async descargarPDF(id) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:3000/api/fincas/${id}/pdf`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `finca_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error al descargar PDF:', error.response?.data || error.message);
        alert('No se pudo descargar el documento.');
      }
    },
    async descargarPDFTodas() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/fincas/pdf/todas', {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `fincas_todas.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error al descargar PDF de todas las fincas:', error.response?.data || error.message);
        alert('No se pudo descargar el documento con todas las fincas.');
      }
    },
  },
  mounted() {
    this.fetchFincas();
  },
};
</script>

<style scoped>
.listar-fincas {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

thead {
  background-color: #e9ecef;
}

th, td {
  padding: 8px;
  text-align: left;
  border: 1px solid #ccc;
}

button {
  cursor: pointer;
  padding: 6px 10px;
  background-color: #4caf50;
  border: none;
  color: white;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #45a049;
}

.btn-todas {
  margin-bottom: 15px;
}

/* Responsive estilo "stacked table" */
@media (max-width: 864px) {
  table,
  thead,
  tbody,
  th,
  td,
  tr {
    display: block;
  }

  thead {
    display: none;
  }

  tr {
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 10px;
    background-color: white;
  }

  td {
    position: relative;
    padding-left: 50%;
    text-align: left;
    border: none;
    border-bottom: 1px solid #eee;
  }

  td::before {
    position: absolute;
    top: 8px;
    left: 10px;
    width: 45%;
    padding-right: 10px;
    white-space: nowrap;
    content: attr(data-label);
    font-weight: bold;
    color: #555;
  }

  .btn-todas {
    width: 100%;
    padding: 10px;
    font-size: 15px;
  }

  button {
    width: 100%;
    margin-top: 8px;
  }
}
</style>
