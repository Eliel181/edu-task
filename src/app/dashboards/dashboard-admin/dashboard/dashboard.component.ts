import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
interface Activity {
  id: number;
  actor: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
  avatar: string;
}

interface School {
  id: number;
  name: string;
  director: string;
  contact: string;
  students: number;
  status: 'active' | 'inactive';
  progress: number;
}

interface Task {
  id: number;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  assignedTo: string;
  dueDate: string;
  startDate: string;
}
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

    escuelas = [
    {
      nombre: "Instituto San Martín",
      tipo: "Secundaria",
      estudiantes: 450,
      director: "Ana García",
      telefono: "+34 912 345 678",
      estado: "Activa",
      rendimiento: 92,
      imagen: "/api/placeholder/48/48",
    },
    {
      nombre: "Colegio Cervantes",
      tipo: "Primaria",
      estudiantes: 320,
      director: "Carlos López",
      telefono: "+34 913 456 789",
      estado: "Activa",
      rendimiento: 88,
      imagen: "/api/placeholder/48/48",
    },
    {
      nombre: "Escuela Técnica Industrial",
      tipo: "Técnica",
      estudiantes: 280,
      director: "María Rodríguez",
      telefono: "+34 914 567 890",
      estado: "Activa",
      rendimiento: 85,
      imagen: "/api/placeholder/48/48",
    },
    {
      nombre: "Centro Educativo Futuro",
      tipo: "Bachillerato",
      estudiantes: 195,
      director: "José Martínez",
      telefono: "+34 915 678 901",
      estado: "En Revisión",
      rendimiento: 90,
      imagen: "/api/placeholder/48/48",
    },
  ]

  actividades = [
    {
      usuario: "Ana García",
      descripcion: "Inició sesión en el sistema",
      tiempo: "Hace 5 minutos",
      tipo: "login",
    },
    {
      usuario: "Carlos López",
      descripcion: 'Completó la tarea "Revisión de calificaciones"',
      tiempo: "Hace 12 minutos",
      tipo: "task",
    },
    {
      usuario: "María Rodríguez",
      descripcion: "Se registró como nuevo usuario",
      tiempo: "Hace 25 minutos",
      tipo: "register",
    },
    {
      usuario: "José Martínez",
      descripcion: "Cerró sesión",
      tiempo: "Hace 1 hora",
      tipo: "logout",
    },
    {
      usuario: "Laura Sánchez",
      descripcion: "Inició sesión en el sistema",
      tiempo: "Hace 2 horas",
      tipo: "login",
    },
    {
      usuario: "Pedro Gómez",
      descripcion: 'Completó la tarea "Actualización de datos"',
      tiempo: "Hace 3 horas",
      tipo: "task",
    },
  ]

  tareas = [
    {
      titulo: "Revisión Trimestral",
      descripcion: "Evaluar rendimiento académico del trimestre",
      asignado: "Ana García",
      fecha: "15 Dic",
      progreso: 85,
      prioridad: "alta",
      estado: "En Progreso",
    },
    {
      titulo: "Actualizar Expedientes",
      descripcion: "Actualizar información de estudiantes nuevos",
      asignado: "Carlos López",
      fecha: "18 Dic",
      progreso: 60,
      prioridad: "media",
      estado: "En Progreso",
    },
    {
      titulo: "Planificación 2024",
      descripcion: "Preparar calendario académico del próximo año",
      asignado: "María Rodríguez",
      fecha: "20 Dic",
      progreso: 30,
      prioridad: "baja",
      estado: "Pendiente",
    },
    {
      titulo: "Informe Mensual",
      descripcion: "Generar reporte de actividades del mes",
      asignado: "José Martínez",
      fecha: "12 Dic",
      progreso: 100,
      prioridad: "alta",
      estado: "Completada",
    },
  ]

  getActivityIconClass(tipo: string): string {
    const classes = {
      login: "bg-green-100 text-green-600",
      logout: "bg-red-100 text-red-600",
      register: "bg-blue-100 text-blue-600",
      task: "bg-purple-100 text-purple-600",
    }
    return classes[tipo as keyof typeof classes] || "bg-gray-100 text-gray-600"
  }

  getPriorityClass(prioridad: string): string {
    const classes = {
      alta: "bg-red-500",
      media: "bg-yellow-500",
      baja: "bg-green-500",
    }
    return classes[prioridad as keyof typeof classes] || "bg-gray-500"
  }

  getStatusClass(estado: string): string {
    const classes = {
      Completada: "bg-green-100 text-green-700",
      "En Progreso": "bg-blue-100 text-blue-700",
      Pendiente: "bg-yellow-100 text-yellow-700",
    }
    return classes[estado as keyof typeof classes] || "bg-gray-100 text-gray-700"
  }
}
