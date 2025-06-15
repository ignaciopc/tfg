<template>
    <div class="calendar-container container py-4">
        <div class="row justify-content-center">
            <div class="col-lg-8 col-md-10 col-sm-12">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h2 class="card-title mb-4 text-center">📆 Calendario de mis tareas</h2>
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
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                },
                height: 'auto',
                events: [],
                locale: 'es',
            }
        }
    },
    mounted() {
        this.cargarTareas()
    },
    methods: {
        formatearFecha(fecha) {
            if (!fecha) return null
            if (typeof fecha === 'string') return fecha.slice(0, 10)
            if (typeof fecha === 'number') return new Date(fecha).toISOString().slice(0, 10)
            if (fecha instanceof Date) return fecha.toISOString().slice(0, 10)
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
                const baseURL = import.meta.env.VITE_API_URL

                const response = await axios.get(`${baseURL}/api/fincas/tareas-multiples`, {
                    headers: { Authorization: `Bearer ${token}` }
                })

                if (Array.isArray(response.data?.tareas)) {
                    this.tareas = response.data.tareas
                } else {
                    this.tareas = []
                    console.warn('No se encontraron tareas.')
                }

                this.calendarOptions.events = this.tareas
                    .map(tarea => {
                        const start = this.formatearFecha(tarea.fecha_inicio)
                        const end = tarea.fecha_fin
                            ? this.sumarUnDia(this.formatearFecha(tarea.fecha_fin))
                            : this.sumarUnDia(start)

                        return start
                            ? {
                                title: tarea.titulo,
                                start,
                                end,
                                allDay: true
                            }
                            : null
                    })
                    .filter(e => e !== null)

            } catch (error) {
                console.error('Error cargando tareas:', error)
            }
        }
    }
}
</script>


<style>
.calendar-container {
    padding-left: 10px;
    padding-right: 10px;
}

.card {
    border-radius: 10px;
    overflow-x: auto;
}

.fc .fc-toolbar-title {
    font-size: 16px;
    /* Título del mes */
    font-weight: 500;
}

.fc .fc-button {
    font-size: 12px;
    padding: 4px 8px;
    height: 28px;
    line-height: 1;
}

.fc .fc-button-group {
    gap: 4px;
}

.fc .fc-col-header-cell {
    font-size: 12px;
    padding: 6px 0;
}

.fc .fc-daygrid-day-number {
    font-size: 12px;
    margin-right: 4px;
}

.fc .fc-event-title {
    font-size: 12px;
    padding: 2px 4px;
}

.fc .fc-event {
    margin-bottom: 3px;
    border-radius: 4px;
}


/* Estilos responsive para móviles */
@media (max-width: 576px) {
    .fc .fc-toolbar {
        flex-direction: column !important;
        gap: 8px !important;
    }

    .fc .fc-toolbar-chunk {
        text-align: center;
    }

    .fc .fc-toolbar-title {
        font-size: 14px;
    }

    .fc .fc-button {
        font-size: 11px;
        padding: 3px 6px;
        height: 24px;
    }

    .fc .fc-col-header-cell,
    .fc .fc-daygrid-day-number,
    .fc .fc-event-title {
        font-size: 11px;
    }
}
</style>
