import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
interface Eleccion {
  id: number
  titulo: string
  descripcion: string
  fechaInicio: Date
  fechaFin: Date
  estado: "activa" | "proxima" | "finalizada"
  imagen: string
  participantes: number
}interface Countdown {
  dias: number
  horas: number
  minutos: number
  segundos: number
}
@Component({
  selector: 'app-lista-elecciones',
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-elecciones.component.html',
  styleUrl: './lista-elecciones.component.css'
})
export class ListaEleccionesComponent implements OnInit, OnDestroy {
  private intervalId: any

  elecciones = signal<Eleccion[]>([
    {
      id: 1,
      titulo: "Elección de Reina 2025",
      descripcion: "Vota por tu candidata favorita para representar a nuestra comunidad en el año 2025",
      fechaInicio: new Date("2025-01-15"),
      fechaFin: new Date("2025-10-17"),
      estado: "activa",
      imagen: "/elegant-crown-and-roses.jpg",
      participantes: 10,
    },
    {
      id: 2,
      titulo: "Miss Universidad 2025",
      descripcion: "Elige a la representante estudiantil que llevará el título de Miss Universidad",
      fechaInicio: new Date("2025-11-01"),
      fechaFin: new Date("2025-12-15"),
      estado: "proxima",
      imagen: "/university-graduation-elegant.jpg",
      participantes: 8,
    },
    {
      id: 3,
      titulo: "Reina de Primavera 2024",
      descripcion: "Evento finalizado - Conoce a la ganadora de la temporada pasada",
      fechaInicio: new Date("2024-03-01"),
      fechaFin: new Date("2024-09-30"),
      estado: "finalizada",
      imagen: "/spring-flowers-crown.jpg",
      participantes: 12,
    },
    {
      id: 4,
      titulo: "Miss Elegancia 2026",
      descripcion: "Próximamente - Prepárate para votar por la candidata más elegante del año",
      fechaInicio: new Date("2026-02-01"),
      fechaFin: new Date("2026-08-30"),
      estado: "proxima",
      imagen: "/elegant-evening-gown.png",
      participantes: 15,
    },
  ])

  countdowns = signal<Map<number, Countdown>>(new Map())

  ngOnInit() {
    this.updateCountdowns()
    this.intervalId = setInterval(() => {
      this.updateCountdowns()
    }, 1000)
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }

  updateCountdowns() {
    const now = new Date()
    const newCountdowns = new Map<number, Countdown>()

    this.elecciones().forEach((eleccion) => {
      let targetDate: Date

      if (eleccion.estado === "proxima") {
        targetDate = eleccion.fechaInicio
      } else if (eleccion.estado === "activa") {
        targetDate = eleccion.fechaFin
      } else {
        targetDate = eleccion.fechaFin
      }

      const diff = targetDate.getTime() - now.getTime()

      if (diff > 0) {
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const segundos = Math.floor((diff % (1000 * 60)) / 1000)

        newCountdowns.set(eleccion.id, { dias, horas, minutos, segundos })
      } else {
        newCountdowns.set(eleccion.id, { dias: 0, horas: 0, minutos: 0, segundos: 0 })
      }
    })

    this.countdowns.set(newCountdowns)
  }


    getCountdown(eleccionId: number): Countdown {
    return this.countdowns().get(eleccionId) || { dias: 0, horas: 0, minutos: 0, segundos: 0 }
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case "activa":
        return "bg-gradient-to-r from-green-500 to-emerald-600"
      case "proxima":
        return "bg-gradient-to-r from-[#5956e9] to-[#6d71f9]"
      case "finalizada":
        return "bg-gradient-to-r from-gray-500 to-slate-600"
      default:
        return "bg-gray-500"
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case "activa":
        return "Votación Activa"
      case "proxima":
        return "Próximamente"
      case "finalizada":
        return "Finalizada"
      default:
        return estado
    }
  }

  getCountdownLabel(estado: string): string {
    switch (estado) {
      case "activa":
        return "Finaliza en"
      case "proxima":
        return "Comienza en"
      case "finalizada":
        return "Finalizó"
      default:
        return ""
    }
  }

  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
}