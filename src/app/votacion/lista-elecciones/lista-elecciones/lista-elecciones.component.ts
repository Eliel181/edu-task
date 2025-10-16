import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Candidato, Eleccion } from '../../../core/interfaces/eleccion.model';
import { EleccionService } from '../../../core/services/eleccion.service';

interface Countdown {
  dias: number
  horas: number
  minutos: number
  segundos: number
}

// Mapeo de estados para la UI
type EstadoUI = 'activa' | 'proxima' | 'finalizada';


@Component({
  selector: 'app-lista-elecciones',
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-elecciones.component.html',
  styleUrl: './lista-elecciones.component.css'
})
export class ListaEleccionesComponent implements OnInit, OnDestroy {
  private intervalId: any;
  private eleccionService = inject(EleccionService);

  elecciones = signal<Eleccion[]>([]);
  countdowns = signal<Map<string, Countdown>>(new Map());
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    this.cargarElecciones();
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  cargarElecciones() {
    this.loading.set(true);
    this.eleccionService.getElecciones().subscribe({
      next: (elecciones) => {
        // Ordenar elecciones: primero las iniciadas, luego pendientes, luego finalizadas
        const eleccionesOrdenadas = this.ordenarElecciones(elecciones);
        this.elecciones.set(eleccionesOrdenadas);
        this.loading.set(false);
        this.iniciarCountdown();
      },
      error: (error) => {
        console.error('Error al cargar elecciones:', error)
        this.error.set('Error al cargar las elecciones')
        this.loading.set(false)
      }
    })
  }

  ordenarElecciones(elecciones: Eleccion[]): Eleccion[] {
    return elecciones.sort((a, b) => {
      const estadoA = this.getEstadoEleccion(a);
      const estadoB = this.getEstadoEleccion(b);
      
      const ordenEstados = { 'activa': 1, 'proxima': 2, 'finalizada': 3 };
      return ordenEstados[estadoA] - ordenEstados[estadoB];
    });
  }

  iniciarCountdown() {
    this.updateCountdowns()
    this.intervalId = setInterval(() => {
      this.updateCountdowns()
    }, 1000)
  }

  updateCountdowns() {
    const now = new Date()
    const newCountdowns = new Map<string, Countdown>()

    this.elecciones().forEach((eleccion) => {
      const estadoUI = this.getEstadoEleccion(eleccion);
      let targetDate: Date

      if (estadoUI === "proxima") {
        targetDate = new Date(eleccion.fechaInicio)
      } else if (estadoUI === "activa") {
        targetDate = new Date(eleccion.fechaFin)
      } else {
        targetDate = new Date(eleccion.fechaFin)
      }

      const diff = targetDate.getTime() - now.getTime()

      if (diff > 0) {
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const segundos = Math.floor((diff % (1000 * 60)) / 1000)

        newCountdowns.set(eleccion.id!, { dias, horas, minutos, segundos })
      } else {
        newCountdowns.set(eleccion.id!, { dias: 0, horas: 0, minutos: 0, segundos: 0 })
      }
    })

    this.countdowns.set(newCountdowns)
  }

  // Convertir estado de la base de datos a estado para la UI
  getEstadoEleccion(eleccion: Eleccion): EstadoUI {
    const ahora = new Date();
    const fechaInicio = new Date(eleccion.fechaInicio);
    const fechaFin = new Date(eleccion.fechaFin);

    if (ahora < fechaInicio) {
      return "proxima";
    } else if (ahora >= fechaInicio && ahora <= fechaFin) {
      return "activa";
    } else {
      return "finalizada";
    }
  }

  // Obtener el estado original de la base de datos
  getEstadoOriginal(eleccion: Eleccion): 'Pendiente' | 'Iniciada' | 'Finalizada' {
    return eleccion.estado;
  }

  getCountdown(eleccionId: string): Countdown {
    return this.countdowns().get(eleccionId) || { dias: 0, horas: 0, minutos: 0, segundos: 0 }
  }

  getEstadoBadgeClass(estado: EstadoUI): string {
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

  getEstadoTexto(estado: EstadoUI): string {
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

  getCountdownLabel(estado: EstadoUI): string {
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

  formatearFecha(fechaString: string): string {
    const fecha = new Date(fechaString)
    return fecha.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  getCantidadCandidatos(eleccion: Eleccion): number {
    return eleccion.candidatos?.length || 0
  }

  // Obtener imagen de portada para la elección (primera imagen del primer candidato)
  getImagenPortada(eleccion: Eleccion): string {
    if (eleccion.candidatos && eleccion.candidatos.length > 0) {
      const primerCandidato = eleccion.candidatos[0];
      if (primerCandidato.imagenes && primerCandidato.imagenes.length > 0) {
        return primerCandidato.imagenes[0].secure_url;
      }
    }
    // Imagen por defecto si no hay candidatos con imágenes
    return '/default-election-image.jpg';
  }

  // Calcular información de votos para mostrar
  getInfoVotos(eleccion: Eleccion): { totalVotos: number, promedioGeneral: number } {
    let totalVotos = 0;
    let sumaPromedios = 0;

    eleccion.candidatos?.forEach(candidato => {
      const votosCandidato = candidato.votos?.length || 0;
      totalVotos += votosCandidato;
      
      if (candidato.promedioGeneral) {
        sumaPromedios += candidato.promedioGeneral;
      }
    });

    const promedioGeneral = eleccion.candidatos?.length > 0 ? sumaPromedios / eleccion.candidatos.length : 0;

    return {
      totalVotos,
      promedioGeneral: Number(promedioGeneral.toFixed(1))
    };
  }

  // Obtener el candidato con mejor puntuación
  getMejorCandidato(eleccion: Eleccion): Candidato | null {
    if (!eleccion.candidatos || eleccion.candidatos.length === 0) {
      return null;
    }

    return eleccion.candidatos.reduce((mejor, actual) => {
      const puntuacionActual = actual.promedioGeneral || 0;
      const puntuacionMejor = mejor.promedioGeneral || 0;
      return puntuacionActual > puntuacionMejor ? actual : mejor;
    });
  }
}