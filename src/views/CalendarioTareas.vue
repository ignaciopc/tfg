<template>
    <div class="container py-4">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h2 class="card-title mb-4 text-center">Calendario de mis tareas</h2>
                        <FullCalendar :options="calendarOptions" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import axios from 'axios'

export default {
    components: {
        FullCalendar,
    },
    data() {
        return {
            tareas: [],
            calendarOptions: {
                plugins: [dayGridPlugin, timeGridPlugin],
                initialView: 'dayGridMonth',
                events: []
            }
        }
    },
    mounted() {
        this.cargarTareas()
    },
    methods: {
        formatearFecha(fecha) {
            if (!fecha) return null

            if (typeof fecha === 'string') {
                return fecha.slice(0, 10)
            } else if (typeof fecha === 'number') {
                return new Date(fecha).toISOString().slice(0, 10)
            } else if (fecha instanceof Date) {
                return fecha.toISOString().slice(0, 10)
            }

            return null
        },

        sumarUnDia(fechaStr) {
            const fecha = new Date(fechaStr)
            fecha.setDate(fecha.getDate() + 1)
            return fecha.toISOString().slice(0, 10)
        },

        async cargarTareas() {
            try {
                const token = localStorage.getItem('token')

                const response = await axios.get('/api/fincas/tareas-multiples', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                if (response.data && Array.isArray(response.data.tareas)) {
                    this.tareas = response.data.tareas
                } else {
                    this.tareas = []
                    console.warn('La respuesta no contiene un array de tareas válido.')
                }

                this.calendarOptions.events = this.tareas.map(tarea => {
                    const start = this.formatearFecha(tarea.fecha_inicio)
                    const end = tarea.fecha_fin ? this.sumarUnDia(this.formatearFecha(tarea.fecha_fin)) : this.sumarUnDia(start)

                    if (!start) return null

                    return {
                        title: tarea.titulo,
                        start,
                        end,
                        allDay: true
                    }
                }).filter(e => e !== null)

            } catch (error) {
                console.error('Error cargando tareas:', error)
            }
        }
    }

}
</script>
