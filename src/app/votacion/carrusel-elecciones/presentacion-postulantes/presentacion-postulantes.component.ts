import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import confetti from 'canvas-confetti';



interface CriterioEvaluacion {
  id: string
  nombre: string
  peso?: number
}

interface Candidate {
  id: number
  name: string
  age: number
  city: string
  proposal: string
  images: string[]
  votes: number
  category?: string
  hobbies?: string[]
}

interface VotoCriterio {
  candidataId: number
  criterioId: string
  valor: number // 1-5 estrellas
}
@Component({
  selector: 'app-presentacion-postulantes',
  imports: [CommonModule, RouterModule],
  templateUrl: './presentacion-postulantes.component.html',
  styleUrl: './presentacion-postulantes.component.css'
})
export class PresentacionPostulantesComponent implements AfterViewInit {
  endDate = signal<Date>(new Date("2025-10-17T23:59:59"))
  countdown = signal<string>("00:00:00")
  private countdownInterval: any

  criterios = signal<CriterioEvaluacion[]>([
    { id: "belleza", nombre: "Belleza", peso: 1 },
    { id: "simpatia", nombre: "Simpatía", peso: 1 },
    { id: "elegancia", nombre: "Elegancia", peso: 1 },
    { id: "naturalidad", nombre: "Naturalidad", peso: 1 },
  ])

  votaciones = signal<VotoCriterio[]>([])
  votacionFinalizada = signal<boolean>(false)

  candidates = signal<Candidate[]>([
    {
      id: 1,
      name: "Isabella Martínez",
      age: 22,
      city: "Ciudad de México",
      proposal:
        "Promover la educación inclusiva y el empoderamiento femenino en comunidades rurales. Creo en un futuro donde todas las mujeres tengan las mismas oportunidades.",
      images: [
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&h=1000&fit=crop",
      ],
      votes: 245,
      category: "Favorita",
      hobbies: ["Danza", "Lectura", "Voluntariado"],
    },
    {
      id: 2,
      name: "Sofía Rodríguez",
      age: 21,
      city: "Guadalajara",
      proposal:
        "Impulsar proyectos de sustentabilidad ambiental y concientización sobre el cambio climático en nuestra región.",
      images: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1517841905240-2eeaad7c3fe5?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=1000&fit=crop",
      ],
      votes: 198,
      hobbies: ["Yoga", "Fotografía", "Ecología"],
    },
    {
      id: 3,
      name: "Valentina Torres",
      age: 23,
      city: "Monterrey",
      proposal:
        "Crear programas de apoyo para jóvenes emprendedores y fomentar la innovación tecnológica en nuestra comunidad.",
      images: [
        "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&h=1000&fit=crop",
      ],
      votes: 187,
      hobbies: ["Programación", "Emprendimiento", "Música"],
    },
    {
      id: 4,
      name: "Camila Hernández",
      age: 20,
      city: "Puebla",
      proposal:
        "Desarrollar iniciativas culturales que preserven nuestras tradiciones y promuevan el arte local entre las nuevas generaciones.",
      images: [
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1506794778202-cd596325d314?w=800&h=1000&fit=crop",
      ],
      votes: 156,
      hobbies: ["Pintura", "Teatro", "Historia"],
    },
    {
      id: 5,
      name: "Lucía Gómez",
      age: 22,
      city: "Querétaro",
      proposal: "Trabajar por la salud mental de los jóvenes y crear espacios seguros de expresión y apoyo emocional.",
      images: [
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1496440737103-cd596325d314?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1509967419530-da38b470e1f6?w=800&h=1000&fit=crop",
      ],
      votes: 143,
      hobbies: ["Meditación", "Escritura", "Psicología"],
    },
    {
      id: 6,
      name: "Martina Silva",
      age: 21,
      city: "Mérida",
      proposal: "Promover el turismo responsable y la conservación de nuestro patrimonio histórico y natural.",
      images: [
        "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1503185912284-5271ff81b9a8?w=800&h=1000&fit=crop",
      ],
      votes: 132,
      hobbies: ["Viajes", "Arqueología", "Gastronomía"],
    },
    {
      id: 7,
      name: "Emma Ramírez",
      age: 23,
      city: "Cancún",
      proposal: "Impulsar programas deportivos inclusivos y promover hábitos de vida saludable en todas las edades.",
      images: [
        "https://images.unsplash.com/photo-1504439904031-93ded9f93e4e?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1515077678510-ce3bdf418862?w=800&h=1000&fit=crop",
      ],
      votes: 128,
      hobbies: ["Natación", "Nutrición", "Atletismo"],
    }
  ])

  imageIndices = signal<Map<number, number>>(new Map())

  showVoteMessage = signal<boolean>(false)
  showFinalizarPanel = signal<boolean>(false)

  // Computed values
  totalVotes = computed(() => this.candidates().reduce((sum, c) => sum + c.votes, 0))

  hasVotedAllCriteriaForCandidate(candidataId: number): boolean {
    const votosActuales = this.votaciones().filter((v) => v.candidataId === candidataId)
    return votosActuales.length === this.criterios().length
  }

  hasVotedAllCandidates = computed(() => {
    return this.candidates().every((c) => this.hasVotedAllCriteriaForCandidate(c.id))
  })

  getVotoCriterio(candidataId: number, criterioId: string): number {
    const voto = this.votaciones().find((v) => v.candidataId === candidataId && v.criterioId === criterioId)
    return voto?.valor || 0
  }

  votarCriterio(candidataId: number, criterioId: string, valor: number): void {
    if (this.votacionFinalizada()) return

    this.votaciones.update((votos) => {
      const index = votos.findIndex((v) => v.candidataId === candidataId && v.criterioId === criterioId)
      if (index >= 0) {
        const newVotos = [...votos]
        newVotos[index] = { ...newVotos[index], valor }
        return newVotos
      } else {
        return [...votos, { candidataId, criterioId, valor }]
      }
    })
  }

  getCurrentImageIndex(candidataId: number): number {
    return this.imageIndices().get(candidataId) || 0
  }

  nextImage(candidataId: number, totalImages: number): void {
    const currentIndex = this.getCurrentImageIndex(candidataId)
    const newIndex = (currentIndex + 1) % totalImages
    this.imageIndices.update((map) => {
      const newMap = new Map(map)
      newMap.set(candidataId, newIndex)
      return newMap
    })
  }

  prevImage(candidataId: number, totalImages: number): void {
    const currentIndex = this.getCurrentImageIndex(candidataId)
    const newIndex = (currentIndex - 1 + totalImages) % totalImages
    this.imageIndices.update((map) => {
      const newMap = new Map(map)
      newMap.set(candidataId, newIndex)
      return newMap
    })
  }

  goToImage(candidataId: number, index: number): void {
    this.imageIndices.update((map) => {
      const newMap = new Map(map)
      newMap.set(candidataId, index)
      return newMap
    })
  }

  getImageAtOffset(candidataId: number, images: string[], offset: number): string {
    const currentIndex = this.getCurrentImageIndex(candidataId)
    const index = (currentIndex + offset + images.length) % images.length
    return images[index]
  }

  getImageRange(totalImages: number): number[] {
    return Array.from({ length: totalImages }, (_, i) => i)
  }

  getHeartArray(): number[] {
    return [1, 2, 3, 4, 5]
  }

  toggleFinalizarPanel(): void {
    this.showFinalizarPanel.update((show) => !show)
  }

  ngAfterViewInit(): void {
    this.setupScrollAnimations()
  }

  setupScrollAnimations(): void {
    const cards = document.querySelectorAll(".candidate-card")

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("card-visible")
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      },
    )

    cards.forEach((card) => {
      observer.observe(card)
    })
  }

  constructor() {
    this.updateCountdown()
    this.countdownInterval = setInterval(() => {
      this.updateCountdown()
    }, 1000)
  }

  updateCountdown(): void {
    const now = new Date().getTime()
    const end = this.endDate().getTime()
    const distance = end - now

    if (distance < 0) {
      this.countdown.set("00:00:00")
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval)
      }
      return
    }

    const hours = Math.floor(distance / (1000 * 60 * 60))
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((distance % (1000 * 60)) / 1000)

    const formattedHours = hours.toString().padStart(2, "0")
    const formattedMinutes = minutes.toString().padStart(2, "0")
    const formattedSeconds = seconds.toString().padStart(2, "0")

    this.countdown.set(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`)
  }
  finalizarVotacion(): void {
    this.votacionFinalizada.set(true);
    this.showVoteMessage.set(true);

    // 🎉 Lanza el confeti
    this.launchConfetti();

  }


  private launchConfetti(): void {
    // Primer disparo
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });


  }
}
